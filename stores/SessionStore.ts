import { Hash } from "fast-sha256"
import Long from "long"
import { action, computed, makeObservable, observable, reaction, runInAction, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import StartCommandModel from "models/Command"
import ConnectorModel, { ConnectorModelLike } from "models/Connector"
import EvseModel, { EvseModelLike } from "models/Evse"
import LocationModel from "models/Location"
import PaymentModel from "models/Payment"
import SessionModel, { SessionModelLike } from "models/Session"
import SessionInvoiceModel from "models/SessionInvoice"
import TokenAuthorizationModel from "models/TokenAuthorization"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { ecdsaVerify, signatureImport } from "secp256k1"
import {
    getSession,
    getSessionInvoice,
    listSessionInvoices,
    startSession,
    stopSession,
    updateSessionInvoice,
    updateTokenAuthorization
} from "services/SatimotoService"
import { StoreInterface, Store } from "stores/Store"
import { ChargeSessionStatus, toChargeSessionStatus } from "types/chargeSession"
import { PaymentStatus } from "types/payment"
import { SessionInvoiceNotification, SessionUpdateNotification, TokenAuthorizeNotification } from "types/notification"
import { SessionStatus } from "types/session"
import { TokenType } from "types/token"
import { DEBUG } from "utils/build"
import { MINIMUM_RFID_CHARGE_BALANCE, SESSION_INVOICE_UPDATE_INTERVAL } from "utils/constants"
import { Log } from "utils/logging"
import { hexToBytes, toBytes, toSatoshi } from "utils/conversion"

const log = new Log("SessionStore")

export interface SessionStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    status: ChargeSessionStatus
    authorizationId?: string
    tokenType?: TokenType
    location?: LocationModel
    evse?: EvseModelLike
    connector?: ConnectorModelLike
    session?: SessionModelLike
    sessionInvoices: SessionInvoiceModel[]
    sessions: SessionModel[]
    payments: PaymentModel[]

    onSessionInvoiceNotification(notification: SessionInvoiceNotification): Promise<void>
    onSessionUpdateNotification(notification: SessionUpdateNotification): Promise<void>

    payExpiredSessionInvoice(sessionInvoice: SessionInvoiceModel): Promise<void>
    startSession(location: LocationModel, evse: EvseModel, connector: ConnectorModel): Promise<void>
    stopSession(): Promise<void>
}

export class SessionStore implements SessionStoreInterface {
    hydrated = false
    ready = false
    stores

    status = ChargeSessionStatus.IDLE
    authorizationId?: string = undefined
    tokenType?: TokenType = undefined
    verificationKey?: Uint8Array = undefined
    location?: LocationModel = undefined
    evse?: EvseModel = undefined
    connector?: ConnectorModel = undefined
    session?: SessionModel = undefined
    sessionInvoices
    sessionInvoicesUpdateTimer: any = undefined
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
            tokenType: observable,
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

            setIdle: action,
            setReady: action,
            updatePayments: action,
            updateSession: action,
            updateSessionInvoice: action
        })

        makePersistable(
            this,
            {
                name: "SessionStore",
                properties: [
                    "status",
                    "authorizationId",
                    "tokenType",
                    "verificationKey",
                    "location",
                    "evse",
                    "connector",
                    "session",
                    "sessionInvoices",
                    "sessions",
                    "payments"
                ],
                storage: AsyncStorage,
                debugMode: DEBUG
            },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    async initialize(): Promise<void> {
        try {
            reaction(
                () => this.stores.paymentStore.payments,
                () => this.updatePayments()
            )

            when(
                () => this.hydrated,
                () => this.whenHydrated()
            )

            when(
                () => this.stores.lightningStore.syncedToChain,
                () => this.whenSyncedToChain()
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
            : this.status === ChargeSessionStatus.AWAITING_PAYMENT
            ? this.sessionInvoices
                  .reduce((valueMsat, sessionInvoice) => {
                      return valueMsat.add(sessionInvoice.totalMsat)
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

    async fetchExpiredSessionInvoices(): Promise<void> {
        if (this.stores.settingStore.accessToken && this.status === ChargeSessionStatus.IDLE) {
            const response = await listSessionInvoices({ isExpired: true, isSettled: false })
            const sessionInvoices = response.data.listSessionInvoices as SessionInvoiceModel[]

            if (sessionInvoices.length > 0) {
                runInAction(() => {
                    this.status = ChargeSessionStatus.AWAITING_PAYMENT
                    this.sessionInvoices.replace(sessionInvoices)
                })
            }
        }
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
        const response = await getSession({ uid: notification.sessionUid }, !this.session)

        this.updateSession(response.data.getSession as SessionModel)
    }

    async onTokenAuthorizeNotification(notification: TokenAuthorizeNotification): Promise<void> {
        try {
            const authorize = this.stores.channelStore.localBalance >= MINIMUM_RFID_CHARGE_BALANCE
            const response = await updateTokenAuthorization({ authorizationId: notification.authorizationId, authorize })
            const tokenAuthorization = response.data.updateTokenAuthorization as TokenAuthorizationModel

            if (tokenAuthorization.authorized && tokenAuthorization.verificationKey) {
                runInAction(() => {
                    this.authorizationId = tokenAuthorization.authorizationId
                    this.verificationKey = hexToBytes(tokenAuthorization.verificationKey!)
                    this.tokenType = TokenType.RFID
                    this.status = ChargeSessionStatus.STARTING

                    if (tokenAuthorization.location) {
                        this.location = tokenAuthorization.location
                    }
                })
            }
        } catch {}
    }

    async payExpiredSessionInvoice(sessionInvoice: SessionInvoiceModel): Promise<void> {
        if (sessionInvoice.isExpired && !sessionInvoice.isSettled) {
            const response = await updateSessionInvoice(sessionInvoice.id)

            sessionInvoice = this.updateSessionInvoice(response.data.updateSessionInvoice as SessionInvoiceModel)

            const payment = await this.stores.paymentStore.sendPayment({ paymentRequest: sessionInvoice.paymentRequest })

            runInAction(() => {
                if (payment.status === PaymentStatus.SUCCEEDED) {
                    this.sessionInvoices.remove(sessionInvoice)

                    if (this.sessionInvoices.length === 0) {
                        this.status = ChargeSessionStatus.IDLE
                    }
                } else {
                    sessionInvoice.isExpired = true
                }
            })
        }
    }

    setIdle() {
        this.status = ChargeSessionStatus.IDLE
        this.authorizationId = undefined
        this.verificationKey = undefined
        this.tokenType = undefined
        this.session = undefined
        this.location = undefined
        this.evse = undefined
        this.connector = undefined
    }

    setReady() {
        this.ready = true
    }

    async startSession(location: LocationModel, evse: EvseModel, connector: ConnectorModel): Promise<void> {
        const response = await startSession({ locationUid: location.uid, evseUid: evse.uid })
        const startCommand = response.data.startSession as StartCommandModel

        runInAction(() => {
            this.authorizationId = startCommand.authorizationId
            this.verificationKey = hexToBytes(startCommand.verificationKey)
            this.tokenType = TokenType.OTHER
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

        this.location = this.location || this.session.location
        this.evse = this.evse || this.session.evse
        this.connector = this.connector || this.session.connector

        if (this.session.status === SessionStatus.INVALID || this.session.status === SessionStatus.INVOICED) {
            if (this.session.status === SessionStatus.INVOICED) {
                session.connector = this.connector!
                session.evse = this.evse!
                session.location = this.location!
                session.sessionInvoices = this.sessionInvoices

                this.sessions.push(session)
                this.payments.clear()
                this.sessionInvoices.clear()
            }

            this.authorizationId = undefined
            this.verificationKey = undefined
            this.tokenType = undefined
            this.session = undefined
            this.location = undefined
            this.evse = undefined
            this.connector = undefined
        }
    }

    updateSessionInvoice(sessionInvoice: SessionInvoiceModel): SessionInvoiceModel {
        let existingSessionInvoice = this.sessionInvoices.find(({ id }) => id === sessionInvoice.id)

        if (existingSessionInvoice) {
            Object.assign(existingSessionInvoice, sessionInvoice)

            return existingSessionInvoice
        } else {
            this.sessionInvoices.push(sessionInvoice)
        }

        return sessionInvoice
    }

    startSessionInvoiceUpdates() {
        log.debug(`startInvoiceRequestUpdates`)
        if (!this.sessionInvoicesUpdateTimer) {
            this.fetchExpiredSessionInvoices()
            this.sessionInvoicesUpdateTimer = setInterval(this.fetchExpiredSessionInvoices.bind(this), SESSION_INVOICE_UPDATE_INTERVAL * 1000)
        }
    }

    stopSessionInvoiceUpdates() {
        log.debug(`stopSessionInvoiceUpdates`)
        clearInterval(this.sessionInvoicesUpdateTimer)
        this.sessionInvoicesUpdateTimer = null
    }

    async whenHydrated() {
        if (this.status === ChargeSessionStatus.STARTING && this.session) {
            const response = await getSession({ uid: this.session.uid })

            this.updateSession(response.data.getSession as SessionModel)
        } else if (this.status === ChargeSessionStatus.IDLE) {
            this.setIdle()
        }
    }

    async whenSyncedToChain(): Promise<void> {
        this.startSessionInvoiceUpdates()
    }
}
