import { Hash } from "fast-sha256"
import Long from "long"
import { action, computed, makeObservable, observable, reaction, runInAction, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import StartCommandModel, { StopCommandModel } from "models/Command"
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
import { TokenType, toTokenType } from "types/token"
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
    estimatedEnergy: number
    estimatedTime: number
    meteredEnergy: number
    meteredTime: number

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

            addPayment: action,
            setIdle: action,
            setReady: action,
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

    addPayment(payment: PaymentModel) {
        this.payments.unshift(payment)
    }

    async initialize(): Promise<void> {
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
            log.error(`Error Initializing: ${error}`)
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

            if (sessionInvoice) {
                if (!this.verificationKey) {
                    log.debug(`No verfication key to verify invoice signature`)
                    return
                }

                if (notification.paymentRequest !== sessionInvoice.paymentRequest) {
                    log.debug(`Payment request inconsistent with notification`)
                    return
                }

                if (notification.signature !== sessionInvoice.signature) {
                    log.debug(`Signature inconsistent with notification`)
                    return
                }

                const hash = new Hash().update(toBytes(sessionInvoice.paymentRequest)).digest()
                const signature = signatureImport(hexToBytes(sessionInvoice.signature))

                if (!ecdsaVerify(signature, hash, this.verificationKey)) {
                    log.debug(`Signature could not be verified with verification key`)
                    return
                }

                when(
                    () => this.stores.lightningStore.syncedToChain,
                    async () => {
                        const payment = await this.stores.paymentStore.sendPayment({ paymentRequest: notification.paymentRequest })

                        if (payment.status === PaymentStatus.SUCCEEDED) {
                            sessionInvoice.isSettled = true
                            this.addPayment(payment)
                        }

                        this.updateSessionInvoice(sessionInvoice)
                    }
                )
            }
        }
    }

    async onSessionUpdateNotification(notification: SessionUpdateNotification): Promise<void> {
        const response = await getSession({ uid: notification.sessionUid }, !this.session)

        this.updateSession(response.data.getSession as SessionModel)
    }

    async onTokenAuthorizeNotification(notification: TokenAuthorizeNotification): Promise<void> {
        try {
            const authorized = this.stores.channelStore.localBalance >= MINIMUM_RFID_CHARGE_BALANCE
            const response = await updateTokenAuthorization({ authorizationId: notification.authorizationId, authorized })
            const tokenAuthorization = response.data.updateTokenAuthorization as TokenAuthorizationModel

            if (authorized && tokenAuthorization.verificationKey) {
                runInAction(() => {
                    this.authorizationId = tokenAuthorization.authorizationId
                    this.verificationKey = hexToBytes(tokenAuthorization.verificationKey!)

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
        this.estimatedEnergy = 0
        this.estimatedTime = 0
        this.meteredEnergy = 0
        this.meteredTime = 0
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
            this.status = ChargeSessionStatus.STARTING
            this.tokenType = TokenType.OTHER
            this.location = location
            this.evse = evse
            this.connector = connector
        })
    }

    async stopSession(): Promise<void> {
        if (this.authorizationId) {
            const response = await stopSession({ authorizationId: this.authorizationId })
            const stopCommand = response.data.stopSession as StopCommandModel

            runInAction(() => {
                if (this.status === ChargeSessionStatus.STARTING) {
                    this.status = ChargeSessionStatus.IDLE
                    this.tokenType = undefined
                    this.session = undefined
                    this.location = undefined
                    this.evse = undefined
                    this.connector = undefined
                } else {
                    this.status = ChargeSessionStatus.STOPPING
                }
            })
        }
    }

    updateSession(session: SessionModel) {
        // When the session status is INVOICED, dispose of the verification key
        this.session = session
        this.status = toChargeSessionStatus(this.session.status)
        this.tokenType = toTokenType(session.authMethod)
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
            this.estimatedEnergy = 0
            this.estimatedTime = 0
            this.meteredEnergy = 0
            this.meteredTime = 0
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

        this.estimatedEnergy = sessionInvoice.estimatedEnergy || this.estimatedEnergy
        this.estimatedTime = sessionInvoice.estimatedTime ? Math.floor(sessionInvoice.estimatedTime * 60) : this.estimatedTime
        this.meteredEnergy = sessionInvoice.meteredEnergy || this.meteredEnergy
        this.meteredTime = sessionInvoice.meteredTime ? Math.floor(sessionInvoice.meteredTime * 60) : this.meteredTime

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
        if (this.session || this.authorizationId) {
            try {
                const response = await getSession(this.session ? { uid: this.session.uid } : { authorizationId: this.authorizationId })

                this.updateSession(response.data.getSession as SessionModel)
            } catch {
                this.setIdle()
            }
        } else if (this.status === ChargeSessionStatus.IDLE) {
            this.setIdle()
        }
    }

    async whenSyncedToChain(): Promise<void> {
        this.startSessionInvoiceUpdates()
    }
}
