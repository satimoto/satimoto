import Long from "long"
import { action, computed, makeObservable, observable, reaction, runInAction, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import ConnectorModel, { ConnectorModelLike } from "models/Connector"
import EvseModel, { EvseModelLike } from "models/Evse"
import LocationModel from "models/Location"
import PaymentModel from "models/Payment"
import SessionModel, { SessionModelLike } from "models/Session"
import SessionInvoiceModel from "models/SessionInvoice"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { ecdsaVerify, signatureImport } from "secp256k1"
import { getSession, getSessionInvoice, startSession, stopSession, updateTokenAuthorization } from "services/SatimotoService"
import { StoreInterface, Store } from "stores/Store"
import { ChargeSessionStatus, toChargeSessionStatus } from "types/chargeSession"
import { PaymentStatus } from "types/payment"
import { SessionInvoiceNotification, SessionUpdateNotification, TokenAuthorizeNotification } from "types/notification"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"
import { hexToBytes, toBytes, toSatoshi } from "utils/conversion"
import { Hash } from "fast-sha256"
import { SessionStatus } from "types/session"

const log = new Log("SessionStore")

export interface SessionStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    status: ChargeSessionStatus
    authorizationId?: string
    location?: LocationModel
    evse?: EvseModelLike
    connector?: ConnectorModelLike
    session?: SessionModelLike
    sessionInvoices: SessionInvoiceModel[]
    sessions: SessionModel[]
    payments: PaymentModel[]

    onSessionInvoiceNotification(notification: SessionInvoiceNotification): Promise<void>
    onSessionUpdateNotification(notification: SessionUpdateNotification): Promise<void>

    startSession(location: LocationModel, evse: EvseModel, connector: ConnectorModel): Promise<void>
    stopSession(): Promise<void>
}

export class SessionStore implements SessionStoreInterface {
    hydrated = false
    ready = false
    stores

    status = ChargeSessionStatus.IDLE
    authorizationId?: string = undefined
    verificationKey?: Uint8Array = undefined
    location?: LocationModel = undefined
    evse?: EvseModel = undefined
    connector?: ConnectorModel = undefined
    session?: SessionModel = undefined
    sessionInvoices
    sessions
    payments

    constructor(stores: Store) {
        this.stores = stores
        this.sessionInvoices = observable<SessionInvoiceModel>([])
        this.sessions = observable<SessionModel>([])
        this.payments = observable<PaymentModel>([])

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            status: observable,
            authorizationId: observable,
            location: observable,
            evse: observable,
            connector: observable,
            session: observable,
            sessionInvoices: observable,
            sessions: observable,
            payments: observable,

            valueMsat: computed,
            valueSat: computed,
            feeMsat: computed,
            feeSat: computed,

            setReady: action,
            updatePayments: action,
            updateSession: action,
            updateSessionInvoice: action
        })

        makePersistable(this, { name: "SessionStore", properties: ["sessions"], storage: AsyncStorage, debugMode: DEBUG }, { delay: 1000 }).then(
            action((persistStore) => (this.hydrated = persistStore.isHydrated))
        )
    }

    async initialize(): Promise<void> {
        try {
            reaction(
                () => this.stores.paymentStore.payments,
                () => this.updatePayments()
            )
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    get valueSat(): string {
        return toSatoshi(this.valueMsat).toString()
    }

    get valueMsat(): string {
        return this.session
            ? this.payments
                  .filter((payment) => payment.description === this.session!.uid)
                  .reduce((valueMsat, payment) => {
                      return valueMsat.add(payment.valueMsat)
                  }, new Long(0))
                  .toString()
            : "0"
    }

    get feeSat(): string {
        return toSatoshi(this.feeMsat).toString()
    }

    get feeMsat(): string {
        return this.session
            ? this.payments
                  .filter((payment) => payment.description === this.session!.uid)
                  .reduce((feeMsat, payment) => {
                      return feeMsat.add(payment.feeMsat)
                  }, new Long(0))
                  .toString()
            : "0"
    }

    async onSessionInvoiceNotification(notification: SessionInvoiceNotification): Promise<void> {
        if (this.session) {
            const response = await getSessionInvoice(notification.sessionInvoiceId)
            const sessionInvoice = response.data.getSessionInvoice as SessionInvoiceModel

            if (
                sessionInvoice &&
                this.verificationKey &&
                notification.paymentRequest === sessionInvoice.paymentRequest &&
                notification.signature === sessionInvoice.signature
            ) {
                const hash = new Hash().update(toBytes(sessionInvoice.paymentRequest)).digest()
                const signature = signatureImport(hexToBytes(sessionInvoice.signature))

                if (ecdsaVerify(signature, hash, this.verificationKey)) {
                    when(
                        () => this.stores.lightningStore.syncedToChain,
                        async () => {
                            const payment = await this.stores.paymentStore.sendPayment({ paymentRequest: notification.paymentRequest })

                            if (payment.status === PaymentStatus.SUCCEEDED) {
                                sessionInvoice.isSettled = true
                            }

                            this.updateSessionInvoice(sessionInvoice)
                        }
                    )
                }
            }
        }
    }

    async onSessionUpdateNotification(notification: SessionUpdateNotification): Promise<void> {
        const response = await getSession({ uid: notification.sessionUid })

        this.updateSession(response.data.getSession as SessionModel)
    }

    async onTokenAuthorizeNotification(notification: TokenAuthorizeNotification): Promise<void> {
        try {
            const response = await updateTokenAuthorization({ authorizationId: notification.authorizationId, authorize: true })

            runInAction(() => {
                this.authorizationId = response.data.authorizationId
                this.verificationKey = hexToBytes(response.data.verificationKey)
                this.status = ChargeSessionStatus.STARTING

                if (response.data.location) {
                    this.location = response.data.location as LocationModel
                }
            })
        } catch {}
    }

    setReady() {
        this.ready = true
    }

    async startSession(location: LocationModel, evse: EvseModel, connector: ConnectorModel): Promise<void> {
        const response = await startSession({ locationUid: location.uid, evseUid: evse.uid })

        runInAction(() => {
            this.authorizationId = response.data.authorizationId
            this.verificationKey = hexToBytes(response.data.verificationKey)
            this.status = ChargeSessionStatus.STARTING
            this.location = location
            this.evse = evse
            this.connector = connector
        })
    }

    async stopSession(): Promise<void> {
        if (this.session) {
            await stopSession({ sessionUid: this.session.uid })

            runInAction(() => {
                this.status = ChargeSessionStatus.STOPPING
            })
        }
    }

    updatePayments() {
        if (this.session && this.status != ChargeSessionStatus.IDLE) {
            this.payments.replace(this.stores.paymentStore.payments.filter((payment) => payment.description === this.session!.uid))
        }
    }

    updateSession(session: SessionModel) {
        // When the session status is INVOICED, dispose of the verification key
        this.session = session
        this.status = toChargeSessionStatus(this.session.status)

        if (this.session.status == SessionStatus.INVOICED) {
            session.connector = this.connector!
            session.evse = this.evse!
            session.location = this.location!
            session.sessionInvoices = this.sessionInvoices

            this.sessions.push(session)
            this.payments.clear()

            this.authorizationId = undefined
            this.verificationKey = undefined
            this.session = undefined
        }
    }

    updateSessionInvoice(sessionInvoice: SessionInvoiceModel) {
        let existingSessionInvoice = this.sessionInvoices.find(({ id }) => id === sessionInvoice.id)

        if (existingSessionInvoice) {
            Object.assign(existingSessionInvoice, sessionInvoice)
        } else {
            this.sessionInvoices.push(sessionInvoice)
        }
    }
}
