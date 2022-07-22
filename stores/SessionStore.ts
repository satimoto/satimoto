import Long from "long"
import { action, computed, makeObservable, observable, reaction } from "mobx"
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

    handleSessionInvoiceNotification(notification: SessionInvoiceNotification): Promise<void>
    handleSessionUpdateNotification(notification: SessionUpdateNotification): Promise<void>

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

            amountMsat: computed,
            amount: computed,

            setReady: action,
            startSession: action,
            stopSession: action,
            updateSession: action,
            updatePayments: action
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

    updatePayments() {
        this.payments.replace(this.stores.paymentStore.payments.filter((payment) => payment.hash === payment.hash))
    }

    setReady() {
        this.ready = true
    }

    async handleSessionInvoiceNotification(notification: SessionInvoiceNotification): Promise<void> {
        if (this.session) {
            const response = await getSessionInvoice(notification.sessionInvoiceId)
            const sessionInvoice = response.data.sessionInvoice as SessionInvoiceModel

            if (sessionInvoice && notification.paymentRequest === sessionInvoice.paymentRequest) {
                let existingSessionInvoice = this.sessionInvoices.find(({ id }) => id === notification.sessionInvoiceId)
                const payment = await this.stores.paymentStore.sendPayment({ paymentRequest: notification.paymentRequest })

                if (payment.status === PaymentStatus.SUCCEEDED) {
                    sessionInvoice.isSettled = true
                }

                if (existingSessionInvoice) {
                    Object.assign(existingSessionInvoice, sessionInvoice)
                } else {
                    this.sessionInvoices.push(sessionInvoice)
                }
            }
        }
    }

    async handleSessionUpdateNotification(notification: SessionUpdateNotification): Promise<void> {
        const response = await getSession({ uid: notification.sessionUid })

        this.updateSession(response.data.session as SessionModel)
    }

    async startSession(location: LocationModel, evse: EvseModel, connector: ConnectorModel): Promise<void> {
        const result = await startSession({ locationUid: location.uid, evseUid: evse.uid })

        this.authorizationId = result.data.authorizationId
        this.status = ChargeSessionStatus.STARTING
        this.location = location
        this.evse = evse
        this.connector = connector
    }

    get amount(): string {
        return toSatoshi(this.amountMsat).toString()
    }

    get amountMsat(): string {
        return this.sessionInvoices
            .reduce((amountMsat, sessionInvoice) => {
                return amountMsat.add(sessionInvoice.amountMsat)
            }, new Long(0))
            .toString()
    }

    async stopSession(): Promise<void> {
        if (this.session) {
            await stopSession({ sessionUid: this.session.uid })
            this.status = ChargeSessionStatus.STOPPING
        }
    }

    updateSession(session: SessionModel) {
        this.session = session
        this.status = toChargeSessionStatus(this.session.status)
    }
}
