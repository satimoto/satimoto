import Long from "long"
import { action, computed, makeObservable, observable, when } from "mobx"
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
import NetInfo from "@react-native-community/netinfo"
import {
    getSession,
    getSessionInvoice,
    listSessions,
    listSessionInvoices,
    startSession,
    stopSession,
    updateTokenAuthorization,
    updateSession
} from "services/satimoto"
import { StoreInterface, Store } from "stores/Store"
import { ChargeSessionStatus, toChargeSessionStatus } from "types/chargeSession"
import { PaymentStatus } from "types/payment"
import { SessionInvoiceNotification, SessionUpdateNotification, TokenAuthorizeNotification } from "types/notification"
import { SessionStatus } from "types/session"
import { TokenType, toTokenType } from "types/token"
import { DEBUG } from "utils/build"
import { MINIMUM_RFID_CHARGE_BALANCE, SESSION_INVOICE_UPDATE_INTERVAL, SESSION_UPDATE_INTERVAL } from "utils/constants"
import { Log } from "utils/logging"
import { toSatoshi } from "utils/conversion"
import { CommandStatus } from "types/command"

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
    estimatedEnergy: number
    estimatedTime: number
    meteredEnergy: number
    meteredTime: number

    onSessionInvoiceNotification(notification: SessionInvoiceNotification): Promise<void>
    onSessionUpdateNotification(notification: SessionUpdateNotification): Promise<void>

    confirmSession(): void
    refreshSessions(): Promise<void>
    startSession(location: LocationModel, evse: EvseModel, connector: ConnectorModel): Promise<void>
    stopSession(): Promise<void>
}

export class SessionStore implements SessionStoreInterface {
    hydrated = false
    ready = false
    queue: any = undefined
    stores

    status = ChargeSessionStatus.IDLE
    authorizationId?: string = undefined
    tokenType?: TokenType = undefined
    location?: LocationModel = undefined
    evse?: EvseModel = undefined
    connector?: ConnectorModel = undefined
    session?: SessionModel = undefined
    sessionUpdateTimer: any = undefined
    sessionInvoices
    sessionInvoicesUpdateTimer: any = undefined
    sessions
    payments
    estimatedEnergy: number = 0
    estimatedTime: number = 0
    meteredEnergy: number = 0
    meteredTime: number = 0

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
            estimatedEnergy: observable,
            estimatedTime: observable,
            meteredEnergy: observable,
            meteredTime: observable,

            valueMsat: computed,
            valueSat: computed,
            feeMsat: computed,
            feeSat: computed,

            actionAddPayment: action,
            actionResetSessions: action,
            actionSetIdle: action,
            actionSetReady: action,
            actionStartSession: action,
            actionStopSession: action,
            actionTokenAuthorization: action,
            actionUpdateSession: action,
            actionUpdateSessions: action,
            actionUpdateSessionInvoice: action
        })

        makePersistable(
            this,
            {
                name: "SessionStore",
                properties: [
                    "status",
                    "authorizationId",
                    "tokenType",
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
        this.queue = this.stores.queue

        try {
            when(
                () => this.hydrated,
                () => this.whenHydrated()
            )

            when(
                () => this.stores.lightningStore.syncedToChain,
                () => this.whenSyncedToChain()
            )
        } catch (error) {
            log.error(`SAT067: Error Initializing: ${error}`, true)
        }
    }

    get valueSat(): string {
        return toSatoshi(this.valueMsat).toString()
    }

    get valueMsat(): string {
        return this.session
            ? this.payments
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
                  .reduce((feeMsat, payment) => {
                      return feeMsat.add(payment.feeMsat)
                  }, new Long(0))
                  .toString()
            : "0"
    }

    async confirmSession() {
        if (this.stores.settingStore.accessToken && this.session) {
            const response = await updateSession({ uid: this.session.uid, isConfirmed: true })
            const session = response.data.updateSession as SessionModel

            this.actionUpdateSession(session)
        }
    }

    async fetchSession(): Promise<void> {
        if (this.stores.settingStore.accessToken && (this.session || this.authorizationId)) {
            const response = await getSession(this.session ? { uid: this.session.uid } : { authorizationId: this.authorizationId })
            const session = response.data.getSession as SessionModel

            this.actionUpdateSession(session)
        }
    }

    async fetchSessionInvoices(): Promise<void> {
        if (this.stores.settingStore.accessToken) {
            const response = await listSessionInvoices({ isExpired: false, isSettled: false })
            const sessionInvoices = response.data.listSessionInvoices as SessionInvoiceModel[]

            log.debug(`SAT068: fetchSessionInvoices: count=${sessionInvoices.length}`)

            for (const sessionInvoice of sessionInvoices) {
                this.paySessionInvoice(sessionInvoice, false)
            }
        }
    }

    async onSessionInvoiceNotification(notification: SessionInvoiceNotification): Promise<void> {
        if (this.stores.uiStore.appState === "background") {
            const netState = await NetInfo.fetch()

            this.queue.createJob(
                "session-invoice-notification",
                notification,
                {
                    attempts: 3,
                    timeout: 27500
                },
                netState.isConnected && netState.isInternetReachable
            )
        } else {
            await this.workerSessionInvoiceNotification(notification)
        }
    }

    async onSessionUpdateNotification(notification: SessionUpdateNotification): Promise<void> {
        if (this.stores.uiStore.appState === "background") {
            const netState = await NetInfo.fetch()

            this.queue.createJob(
                "session-update-notification",
                notification,
                {
                    attempts: 3,
                    timeout: 1000
                },
                netState.isConnected && netState.isInternetReachable
            )
        } else {
            await this.workerSessionUpdateNotification(notification)
        }
    }

    async onTokenAuthorizeNotification(notification: TokenAuthorizeNotification): Promise<void> {
        try {
            const authorized = this.stores.channelStore.localBalance >= MINIMUM_RFID_CHARGE_BALANCE
            const response = await updateTokenAuthorization({ authorizationId: notification.authorizationId, authorized })
            const tokenAuthorization = response.data.updateTokenAuthorization as TokenAuthorizationModel

            if (authorized) {
                this.actionTokenAuthorization(tokenAuthorization)
            }
        } catch {}
    }

    async paySessionInvoice(sessionInvoice: SessionInvoiceModel, updateMetrics: boolean = true): Promise<void> {
        if (sessionInvoice && !sessionInvoice.isExpired && !sessionInvoice.isSettled) {
            log.debug(`SAT069 paySessionInvoice: id=${sessionInvoice.id} status=${this.status}`, true)
            log.debug(`SAT070 paySessionInvoice: pr=${sessionInvoice.paymentRequest} sig=${sessionInvoice.signature}`, true)

            await when(() => this.stores.lightningStore.syncedToChain)

            const payment = await this.stores.paymentStore.sendPayment(sessionInvoice.paymentRequest)

            if (payment.status === PaymentStatus.SUCCEEDED) {
                sessionInvoice.isSettled = true
                this.actionAddPayment(payment)
            }

            this.actionUpdateSessionInvoice(sessionInvoice, updateMetrics)
        }
    }

    async refreshSessions(): Promise<void> {
        if (this.stores.settingStore.accessToken) {
            const response = await listSessions()
            const sessions = response.data.listSessions as SessionModel[]

            log.debug(`SAT101: refreshSessions: count=${sessions.length}`)
            this.actionUpdateSessions(sessions)
        }
    }

    reset() {
        this.actionResetSessions()
    }

    async startSession(location: LocationModel, evse: EvseModel, connector: ConnectorModel): Promise<void> {
        const response = await startSession({ locationUid: location.uid, evseUid: evse.uid })
        const startCommand = response.data.startSession as StartCommandModel

        if (startCommand.status === CommandStatus.ACCEPTED) {
            this.actionStartSession(startCommand.authorizationId, location, evse, connector)
        }
    }

    async stopSession(): Promise<void> {
        if (this.authorizationId) {
            await stopSession({ authorizationId: this.authorizationId })

            this.actionStopSession()
        }
    }

    updateSessionTimer(start: boolean) {
        if (start && !this.sessionUpdateTimer) {
            log.debug(`SAT072 updateSessionTimer: start`, true)
            this.fetchSession()
            this.sessionUpdateTimer = setInterval(this.fetchSession.bind(this), SESSION_UPDATE_INTERVAL * 1000)
        } else if (!start) {
            log.debug(`SAT073 updateSessionTimer: stop`, true)
            clearInterval(this.sessionUpdateTimer)
            this.sessionUpdateTimer = null
        }
    }

    updateSessionInvoiceTimer(start: boolean) {
        if (start && !this.sessionInvoicesUpdateTimer) {
            log.debug(`SAT074 updateSessionInvoiceTimer: start`, true)
            this.fetchSessionInvoices()
            this.sessionInvoicesUpdateTimer = setInterval(this.fetchSessionInvoices.bind(this), SESSION_INVOICE_UPDATE_INTERVAL * 1000)
        } else if (!start) {
            log.debug(`SAT075 updateSessionInvoiceTimer: stop`, true)
            clearInterval(this.sessionInvoicesUpdateTimer)
            this.sessionInvoicesUpdateTimer = null
        }
    }

    /*
     * Queue workers
     */

    async workerSessionInvoiceNotification(notification: SessionInvoiceNotification): Promise<void> {
        const response = await getSessionInvoice(notification.sessionInvoiceId)
        const sessionInvoice = response.data.getSessionInvoice as SessionInvoiceModel

        await this.paySessionInvoice(sessionInvoice)
    }

    async workerSessionUpdateNotification(notification: SessionUpdateNotification): Promise<void> {
        const response = await getSession({ uid: notification.sessionUid }, { withChargePoint: !this.session })
        const session = response.data.getSession as SessionModel

        this.actionUpdateSession(session)
    }

    /*
     * Mobx actions and reactions
     */

    actionAddPayment(payment: PaymentModel) {
        if (this.status !== ChargeSessionStatus.IDLE) {
            this.payments.unshift(payment)
        }
    }

    actionResetSessions() {
        this.payments.clear()
        this.sessions.clear()
    }

    actionSetIdle() {
        this.status = ChargeSessionStatus.IDLE
        this.authorizationId = undefined
        this.tokenType = undefined
        this.session = undefined
        this.location = undefined
        this.evse = undefined
        this.connector = undefined
        this.estimatedEnergy = 0
        this.estimatedTime = 0
        this.meteredEnergy = 0
        this.meteredTime = 0
    }

    actionSetReady() {
        this.ready = true
    }

    actionStartSession(authorizationId: string, location: LocationModel, evse: EvseModel, connector: ConnectorModel) {
        this.authorizationId = authorizationId
        this.status = ChargeSessionStatus.STARTING
        this.tokenType = TokenType.OTHER
        this.location = location
        this.evse = evse
        this.connector = connector

        this.updateSessionTimer(true)
    }

    actionStopSession() {
        if (this.status === ChargeSessionStatus.STARTING) {
            this.status = ChargeSessionStatus.IDLE
            this.tokenType = undefined
            this.session = undefined
            this.location = undefined
            this.evse = undefined
            this.connector = undefined

            this.updateSessionTimer(false)
        } else if (this.status === ChargeSessionStatus.ACTIVE) {
            this.status = ChargeSessionStatus.STOPPING

            this.updateSessionTimer(true)
        }
    }

    actionTokenAuthorization(tokenAuthorization: TokenAuthorizationModel) {
        this.authorizationId = tokenAuthorization.authorizationId

        if (tokenAuthorization.location) {
            this.location = tokenAuthorization.location
        }

        this.updateSessionTimer(true)
    }

    actionUpdateSession(session: SessionModel) {
        this.session = session
        this.status = toChargeSessionStatus(this.session.status)
        this.tokenType = toTokenType(session.authMethod)
        this.location = this.location || this.session.location
        this.evse = this.evse || this.session.evse
        this.connector = this.connector || this.session.connector

        log.debug(`SAT076 actionUpdateSession: uid=${this.session.uid} status=${this.session.status}/${this.status}`, true)

        if (this.status === ChargeSessionStatus.ACTIVE || this.status === ChargeSessionStatus.IDLE) {
            this.updateSessionTimer(false)
        }

        if (this.session.status === SessionStatus.INVOICED) {
            this.refreshSessions()
        }

        if (this.session.status !== SessionStatus.ACTIVE && this.session.status !== SessionStatus.PENDING) {
            this.payments.clear()
            this.authorizationId = undefined
            this.tokenType = undefined
            this.session = undefined
            this.location = undefined
            this.evse = undefined
            this.connector = undefined
            this.estimatedEnergy = 0
            this.estimatedTime = 0
            this.meteredEnergy = 0
            this.meteredTime = 0
        }
    }

    actionUpdateSessions(sessions: SessionModel[]) {
        this.sessions.replace(sessions)
    }

    actionUpdateSessionInvoice(sessionInvoice: SessionInvoiceModel, updateMetrics: boolean = true): SessionInvoiceModel {
        let existingSessionInvoice = this.sessionInvoices.find(({ id }) => id === sessionInvoice.id)

        if (existingSessionInvoice) {
            Object.assign(existingSessionInvoice, sessionInvoice)

            return existingSessionInvoice
        } else {
            this.sessionInvoices.push(sessionInvoice)
        }

        if (this.status !== ChargeSessionStatus.IDLE && updateMetrics) {
            this.estimatedEnergy = sessionInvoice.estimatedEnergy ? Math.round(sessionInvoice.estimatedEnergy * 100) / 100 : this.estimatedEnergy
            this.estimatedTime = sessionInvoice.estimatedTime ? Math.floor(sessionInvoice.estimatedTime * 60) : this.estimatedTime
            this.meteredEnergy = sessionInvoice.meteredEnergy ? Math.round(sessionInvoice.meteredEnergy * 100) / 100 : this.meteredEnergy
            this.meteredTime = sessionInvoice.meteredTime ? Math.floor(sessionInvoice.meteredTime * 60) : this.meteredTime
        }

        return sessionInvoice
    }

    async whenHydrated() {
        if (this.session || this.authorizationId) {
            try {
                const response = await getSession(this.session ? { uid: this.session.uid } : { authorizationId: this.authorizationId })

                this.actionUpdateSession(response.data.getSession as SessionModel)

                if (this.status === ChargeSessionStatus.STARTING || this.status === ChargeSessionStatus.STOPPING) {
                    this.updateSessionTimer(true)
                }
            } catch {
                this.actionSetIdle()
            }
        } else {
            this.actionSetIdle()
        }
    }

    async whenSyncedToChain(): Promise<void> {
        this.updateSessionInvoiceTimer(true)
    }
}
