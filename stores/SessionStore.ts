import Long from "long"
import { action, computed, makeObservable, observable, reaction, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import ConnectorModel, { ConnectorModelLike } from "models/Connector"
import EvseModel, { EvseModelLike } from "models/Evse"
import LocationModel from "models/Location"
import PaymentModel from "models/Payment"
import SessionModel, { SessionModelLike } from "models/Session"
import SessionInvoiceModel from "models/SessionInvoice"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getSession, getSessionInvoice, startSession, stopSession } from "services/SatimotoService"
import { StoreInterface, Store } from "stores/Store"
import { ChargeSessionStatus, toChargeSessionStatus } from "types/chargeSession"
import { PaymentStatus } from "types/payment"
import { SessionInvoiceNotification, SessionUpdateNotification } from "types/notification"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"
import { toSatoshi } from "utils/conversion"

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
    location?: LocationModel = undefined
    evse?: EvseModel = undefined
    connector?: ConnectorModel = undefined
    session?: SessionModel = undefined
    sessionInvoices
    payments

    constructor(stores: Store) {
        this.stores = stores
        this.sessionInvoices = observable<SessionInvoiceModel>([])
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
            payments: observable,

            valueMsat: computed,
            valueSat: computed,
            feeMsat: computed,
            feeSat: computed,

            setReady: action,
            startSession: action,
            stopSession: action,
            updatePayments: action,
            updateSession: action,
            updateSessionInvoice: action
        })

        makePersistable(this, { name: "SessionStore", properties: [], storage: AsyncStorage, debugMode: DEBUG }, { delay: 1000 }).then(
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

            if (sessionInvoice && notification.paymentRequest === sessionInvoice.paymentRequest) {
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

    async onSessionUpdateNotification(notification: SessionUpdateNotification): Promise<void> {
        const response = await getSession({ uid: notification.sessionUid })

        this.updateSession(response.data.getSession as SessionModel)
    }

    setReady() {
        this.ready = true
    }

    async startSession(location: LocationModel, evse: EvseModel, connector: ConnectorModel): Promise<void> {
        const result = await startSession({ locationUid: location.uid, evseUid: evse.uid })

        this.authorizationId = result.data.authorizationId
        this.status = ChargeSessionStatus.STARTING
        this.location = location
        this.evse = evse
        this.connector = connector
    }

    async stopSession(): Promise<void> {
        if (this.session) {
            await stopSession({ sessionUid: this.session.uid })
            this.status = ChargeSessionStatus.STOPPING
        }
    }

    updatePayments() {
        this.payments.replace(this.stores.paymentStore.payments.filter((payment) => payment.hash === payment.hash))
    }

    updateSession(session: SessionModel) {
        this.session = session
        this.status = toChargeSessionStatus(this.session.status)
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
