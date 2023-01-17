import { LNURLAuthParams, LNURLChannelParams, LNURLPayParams, LNURLResponse, LNURLWithdrawParams } from "js-lnurl"
import { action, computed, makeObservable, observable, reaction, runInAction, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import ConnectorModel from "models/Connector"
import EvseModel from "models/Evse"
import LocationModel from "models/Location"
import { lnrpc } from "proto/proto"
import { AppState, AppStateStatus, Linking } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import NfcManager from "react-native-nfc-manager"
import { StoreInterface, Store } from "stores/Store"
import { decodePayReq } from "services/LightningService"
import { getParams, getTag, identifier } from "services/LnUrlService"
import { assertNetwork } from "utils/assert"
import { DEBUG } from "utils/build"
import { IS_ANDROID, ONBOARDING_VERSION } from "utils/constants"
import { Log } from "utils/logging"
import { PayReq, toPayReq } from "types/payment"
import { Tooltip } from "types/tooltip"
import { errorToString } from "utils/conversion"

const log = new Log("UiStore")
const EVSE_ID_REGEX = /[\/=]([A-Za-z]{2}[*-]?[A-Za-z0-9]{3}[*-]?[eE]{1}[\w*-]+)/
const ID_REGEX = /\/([A-Za-z0-9]+)$/

export interface UiStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    appState: AppStateStatus
    connector?: ConnectorModel
    filterExperimental: boolean
    filterRemoteCapable: boolean
    filterRfidCapable: boolean
    linkToken?: string
    lnUrl?: string
    lnUrlAuthParams?: LNURLAuthParams
    lnUrlChannelParams?: LNURLChannelParams
    lnUrlPayParams?: LNURLPayParams
    lnUrlWithdrawParams?: LNURLWithdrawParams
    paymentRequest?: string
    decodedPaymentRequest?: PayReq
    nfcAvailable: boolean
    onboardingWelcomed: boolean
    onboardingVersion: string
    tooltipShownCards: boolean
    tooltipShownSyncing: boolean

    clearChargePoint(): void
    clearLnUrl(): void
    clearPaymentRequest(): void
    parseIntent(intent: string): Promise<boolean>
    setChargePoint(evse: EvseModel): void
    setFilterExperimental(filter: boolean): void
    setFilterRemoteCapable(filter: boolean): void
    setFilterRfidCapable(filter: boolean): void
    setLightningAddress(address: string): void
    setLinkToken(token?: string): void
    setLnUrlPayParams(payParams: LNURLPayParams): void
    setPaymentRequest(paymentRequest: string): void
    setOnboarding(welcomed: boolean, version: string): void
    setTooltipShown(tooltips: Tooltip): void
}

export class UiStore implements UiStoreInterface {
    hydrated = false
    ready = false
    queue: any = undefined
    stores

    appState: AppStateStatus = "unknown"
    connector?: ConnectorModel = undefined
    evse?: EvseModel = undefined
    location?: LocationModel = undefined
    filterExperimental: boolean = false
    filterRemoteCapable: boolean = true
    filterRfidCapable: boolean = IS_ANDROID
    linkToken?: string = undefined
    lnUrl?: string = undefined
    lnUrlAuthParams?: LNURLAuthParams = undefined
    lnUrlChannelParams?: LNURLChannelParams = undefined
    lnUrlPayParams?: LNURLPayParams = undefined
    lnUrlWithdrawParams?: LNURLWithdrawParams = undefined
    paymentRequest?: string = undefined
    decodedPaymentRequest?: PayReq = undefined
    nfcAvailable: boolean = false
    onboardingWelcomed: boolean = false
    onboardingVersion: string = ""
    tooltipShownCards: boolean = false
    tooltipShownSyncing: boolean = false

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            appState: observable,
            connector: observable,
            evse: observable,
            location: observable,
            filterExperimental: observable,
            filterRemoteCapable: observable,
            filterRfidCapable: observable,
            linkToken: observable,
            lnUrl: observable,
            lnUrlAuthParams: observable,
            lnUrlChannelParams: observable,
            lnUrlPayParams: observable,
            lnUrlWithdrawParams: observable,
            paymentRequest: observable,
            decodedPaymentRequest: observable,
            nfcAvailable: observable,
            onboardingWelcomed: observable,
            onboardingVersion: observable,
            tooltipShownCards: observable,
            tooltipShownSyncing: observable,

            hasOnboardingUpdates: computed,

            actionSetAppState: action,
            actionSetReady: action,
            actionClearChargePoint: action,
            actionClearLnUrl: action,
            actionClearPaymentRequest: action,
            actionSetChargePoint: action,
            actionSetFilterExperimental: action,
            actionSetFilterRemoteCapable: action,
            actionSetFilterRfidCapable: action,
            actionSetLinkToken: action,
            actionSetLnUrl: action,
            actionSetLnUrlPayParams: action,
            actionSetPaymentRequest: action,
            actionSetOnboarding: action,
            actionSetTooltipShown: action
        })

        makePersistable(
            this,
            {
                name: "UiStore",
                properties: [
                    "connector",
                    "evse",
                    "location",
                    "filterRemoteCapable",
                    "filterRfidCapable",
                    "lnUrl",
                    "lnUrlAuthParams",
                    "lnUrlChannelParams",
                    "lnUrlPayParams",
                    "lnUrlWithdrawParams",
                    "paymentRequest",
                    "decodedPaymentRequest",
                    "onboardingWelcomed",
                    "onboardingVersion",
                    "tooltipShownCards",
                    "tooltipShownSyncing"
                ],
                storage: AsyncStorage,
                debugMode: DEBUG
            },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    async initialize(): Promise<void> {
        this.queue = this.stores.queue

        when(
            () => this.hydrated,
            () => this.onHydrated()
        )

        AppState.addEventListener("change", this.actionSetAppState.bind(this))

        this.actionSetReady()
        this.actionSetAppState(AppState.currentState)
    }

    async onHydrated() {
        // Get NFC availability
        const isSupported = await NfcManager.isSupported()

        runInAction(() => {
            this.nfcAvailable = isSupported
        })

        // Process initial intent
        const intent = await Linking.getInitialURL()

        if (intent) {
            this.parseIntent(intent)
        }
    }

    clearChargePoint() {
        this.actionClearChargePoint()
    }

    clearLnUrl() {
        this.actionClearLnUrl()
    }

    clearPaymentRequest() {
        this.actionClearPaymentRequest()
    }

    get hasOnboardingUpdates(): boolean {
        return !this.onboardingWelcomed || this.onboardingVersion !== ONBOARDING_VERSION
    }

    /**
     * There are several different data formats possible which need to be parsed.
     * LNURL: A LNURL spec string with various encoded request types
     * Payment Request: A Lightning payment request
     * Lightning Address: A static internet identifier
     * EVSE ID: A HTTP formatted EVSE ID used to locate a charge point
     * @param intent: Raw intent to be parsed
     * @returns Promise<boolean>: The intent is valid and parsed
     */
    async parseIntent(intent: string): Promise<boolean> {
        log.debug("parseIntent: " + intent)
        intent = intent.replace(/lightning:/i, "").trim()

        const lowerCaseIntent = intent.toLowerCase()
        let errorCode = "Scanner_DataError"

        try {
            if (lowerCaseIntent.startsWith("lnurl")) {
                // LNURL
                try {
                    await this.actionSetLnUrl(intent)
                    return true
                } catch (error) {
                    errorCode = errorToString(error)
                }
            } else if (intent.includes("@")) {
                // Lightning Address
                await this.setLightningAddress(intent)
                return true
            } else if (intent.startsWith("https://satimoto.com/link-token")) {
                // A satimoto URL
                let idMatches = intent.match(ID_REGEX)
                let identifier = idMatches && idMatches.length > 1 ? idMatches[1] : null

                if (identifier) {
                    this.actionSetLinkToken(identifier)
                }
            } else if (lowerCaseIntent.startsWith("http")) {
                // URL, Charge Point identifier
                let evseIdMatches = intent.match(EVSE_ID_REGEX)
                let idMatches = intent.match(ID_REGEX)
                let identifier =
                    evseIdMatches && evseIdMatches.length > 1 ? evseIdMatches[1] : idMatches && idMatches.length > 1 ? idMatches[1] : null

                if (identifier) {
                    let evse = await this.stores.locationStore.searchEvse(identifier)

                    if (evse) {
                        this.actionSetChargePoint(evse)
                        return true
                    }

                    try {
                        // Evse not found, attempt to follow URL for a possible redirect
                        const response = await fetch(intent)
                        const responseLocation = response.headers.get("Location")

                        if (responseLocation) {
                            let evseIdMatches = intent.match(EVSE_ID_REGEX)
                            let idMatches = intent.match(ID_REGEX)
                            let identifier =
                                evseIdMatches && evseIdMatches.length > 1 ? evseIdMatches[1] : idMatches && idMatches.length > 1 ? idMatches[1] : null

                            if (identifier) {
                                evse = await this.stores.locationStore.searchEvse(identifier)

                                if (evse) {
                                    this.actionSetChargePoint(evse)
                                    return true
                                }
                            }
                        }
                    } catch {}

                    errorCode = "Scanner_UnrecognizedEvseIdError"
                }
            } else {
                // Payment Request
                await this.setPaymentRequest(intent)
                return true
            }
        } catch (error) {
            log.debug(JSON.stringify(error))
        }

        throw new Error(errorCode)
    }

    setChargePoint(evse: EvseModel) {
        this.actionSetChargePoint(evse)
    }

    setFilterExperimental(filter: boolean): void {
        this.actionSetFilterExperimental(filter)
    }

    setFilterRemoteCapable(filter: boolean): void {
        this.actionSetFilterRemoteCapable(filter)
    }

    setFilterRfidCapable(filter: boolean): void {
        this.actionSetFilterRfidCapable(filter)
    }

    async setLightningAddress(address: string) {
        const payParams = await identifier(address)
        
        this.actionSetLnUrlPayParams(payParams)
    }

    setLinkToken(token?: string) {
        this.actionSetLinkToken(token)
    }

    setLnUrlPayParams(payParams: LNURLPayParams) {
        this.actionSetLnUrlPayParams(payParams)
    }

    async setPaymentRequest(paymentRequest: string) {
        assertNetwork(paymentRequest)
        const decodedPaymentRequest = await decodePayReq(paymentRequest)

        this.actionSetPaymentRequest(paymentRequest, decodedPaymentRequest)
    }

    setOnboarding(welcomed: boolean, version: string) {
        this.actionSetOnboarding(welcomed, version)
    }

    setTooltipShown(tooltip: Tooltip) {
        this.actionSetTooltipShown(tooltip)
    }

    /*
     * Mobx actions and reactions
     */

    actionClearChargePoint() {
        this.connector = undefined
        this.evse = undefined
        this.location = undefined
    }

    actionClearLnUrl() {
        this.lnUrl = undefined
        this.lnUrlAuthParams = undefined
        this.lnUrlChannelParams = undefined
        this.lnUrlPayParams = undefined
        this.lnUrlWithdrawParams = undefined
    }

    actionClearPaymentRequest() {
        this.paymentRequest = undefined
        this.decodedPaymentRequest = undefined
    }

    actionSetAppState(state: AppStateStatus) {
        log.debug(`App state changed: ${state}`)
        this.appState = state
    }

    actionSetChargePoint(evse: EvseModel) {
        if (evse.location) {
            if (evse.connectors.length == 1) {
                this.evse = evse
                this.connector = this.evse.connectors[0]
                this.location = this.evse.location
            } else {
                const location = evse.location
                delete evse.location

                location.evses = [evse]

                this.stores.locationStore.actionSetSelectedLocation(location)
            }
        }
    }

    actionSetFilterExperimental(filter: boolean): void {
        this.filterExperimental = filter
    }

    actionSetFilterRemoteCapable(filter: boolean): void {
        this.filterRemoteCapable = filter
    }

    actionSetFilterRfidCapable(filter: boolean): void {
        this.filterRfidCapable = filter
    }

    actionSetLinkToken(token?: string) {
        this.linkToken = token
    }

    async actionSetLnUrl(lnUrl: string) {
        this.actionClearLnUrl()

        const params = await getParams(lnUrl)
        const lnUrlResponse = params as LNURLResponse

        if (lnUrlResponse && lnUrlResponse.status === "ERROR") {
            throw new Error(lnUrlResponse.reason)
        }

        const tag = getTag(params)
        log.debug(`Set intent: ${JSON.stringify(params)} tag: ${tag}`)

        runInAction(() => {
            this.lnUrl = lnUrl

            if (tag === "channelRequest") {
                this.lnUrlChannelParams = params as LNURLChannelParams
            } else if (tag === "login") {
                this.lnUrlAuthParams = params as LNURLAuthParams
            } else if (tag === "payRequest") {
                this.lnUrlPayParams = params as LNURLPayParams
            } else if (tag === "withdrawRequest") {
                this.lnUrlWithdrawParams = params as LNURLWithdrawParams
            }
        })
    }

    actionSetLnUrlPayParams(payParams: LNURLPayParams) {
        this.actionClearLnUrl()
        this.lnUrlPayParams = payParams
    }

    async actionSetPaymentRequest(paymentRequest: string, payReq: lnrpc.PayReq) {
        this.decodedPaymentRequest = toPayReq(payReq)
        this.paymentRequest = paymentRequest
        log.debug(JSON.stringify(this.decodedPaymentRequest))
    }

    actionSetOnboarding(welcomed: boolean, version: string) {
        this.onboardingWelcomed = welcomed
        this.onboardingVersion = version
    }

    actionSetReady() {
        this.ready = true
    }

    actionSetTooltipShown({ cards, syncing }: Tooltip) {
        if (cards) {
            this.tooltipShownCards = true
        }

        if (syncing) {
            this.tooltipShownSyncing = true
        }
    }
}
