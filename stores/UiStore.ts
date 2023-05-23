import { action, computed, makeObservable, observable, reaction, runInAction, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import ConnectorModel from "models/Connector"
import EvseModel from "models/Evse"
import LocationModel from "models/Location"
import { AppState, AppStateStatus, Linking } from "react-native"
import * as breezSdk from "@breeztech/react-native-breez-sdk"
import AsyncStorage from "@react-native-async-storage/async-storage"
import NfcManager from "react-native-nfc-manager"
import { StoreInterface, Store } from "stores/Store"
import * as lightning from "services/lightning"
import { assertNetwork } from "utils/assert"
import { DEBUG } from "utils/build"
import { IS_ANDROID, ONBOARDING_VERSION } from "utils/constants"
import { Log } from "utils/logging"
import { Tooltip } from "types/tooltip"
import { LightningBackend } from "types/lightningBackend"

const log = new Log("UiStore")
const EVSE_ID_REGEX = /[\/=?]([A-Za-z]{2}[*-]?[A-Za-z0-9]{3}[*-]?[eE]{1}[\w*-]+)/
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
    lnUrlAuthParams?: breezSdk.LnUrlAuthRequestData
    lnUrlPayParams?: breezSdk.LnUrlPayRequestData
    lnUrlWithdrawParams?: breezSdk.LnUrlWithdrawRequestData
    paymentRequest?: string
    lnInvoice?: breezSdk.LnInvoice
    nfcAvailable: boolean
    onboardingWelcomed: boolean
    onboardingVersion: string
    tooltipShownBackend: boolean
    tooltipShownCards: boolean
    tooltipShownCircuit: boolean
    tooltipShownSyncing: boolean

    clearChargePoint(): void
    clearLnUrl(): void
    clearPaymentRequest(): void
    parseIntent(intent: string): Promise<boolean>
    setChargePoint(evse: EvseModel): void
    setFilterExperimental(filter: boolean): void
    setFilterRemoteCapable(filter: boolean): void
    setFilterRfidCapable(filter: boolean): void
    setLinkToken(token?: string): void
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
    filterExperimental: boolean = true
    filterRemoteCapable: boolean = true
    filterRfidCapable: boolean = IS_ANDROID
    linkToken?: string = undefined
    lnUrl?: string = undefined
    lnUrlAuthParams?: breezSdk.LnUrlAuthRequestData = undefined
    lnUrlPayParams?: breezSdk.LnUrlPayRequestData = undefined
    lnUrlWithdrawParams?: breezSdk.LnUrlWithdrawRequestData = undefined
    paymentRequest?: string = undefined
    lnInvoice?: breezSdk.LnInvoice = undefined
    nfcAvailable: boolean = false
    onboardingWelcomed: boolean = false
    onboardingVersion: string = ""
    tooltipShownBackend: boolean = true
    tooltipShownCards: boolean = false
    tooltipShownCircuit: boolean = false
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
            lnUrlPayParams: observable,
            lnUrlWithdrawParams: observable,
            paymentRequest: observable,
            lnInvoice: observable,
            nfcAvailable: observable,
            onboardingWelcomed: observable,
            onboardingVersion: observable,
            tooltipShownBackend: observable,
            tooltipShownCards: observable,
            tooltipShownCircuit: observable,
            tooltipShownSyncing: observable,

            hasOnboardingUpdates: computed,
            showSyncing: computed,

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
            actionSetLnUrlAuthParams: action,
            actionSetLnUrlPayParams: action,
            actionSetLnUrlWithdrawParams: action,
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
                    "filterExperimental",
                    "filterRemoteCapable",
                    "filterRfidCapable",
                    "lnUrl",
                    "lnUrlAuthParams",
                    "lnUrlPayParams",
                    "lnUrlWithdrawParams",
                    "paymentRequest",
                    "lnInvoice",
                    "onboardingWelcomed",
                    "onboardingVersion",
                    "tooltipShownCards",
                    "tooltipShownCircuit",
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

        reaction(
            () => [this.stores.lightningStore.backend],
            () => this.reactionBackend(),
            { fireImmediately: true }
        )

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

    get showSyncing(): boolean {
        return this.stores.lightningStore.backend !== LightningBackend.BREEZ_SDK
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
        log.debug("SAT084: parseIntent: " + intent, true)
        intent = intent
            .replace(/(lightning|url):/i, "")
            .trim()

        const lowerCaseIntent = intent.toLowerCase()
        let errorCode = "Scanner_DataError"

        try {
            if (intent.startsWith("https://satimoto.com/link-token")) {
                // A satimoto URL
                let idMatches = intent.match(ID_REGEX)
                let identifier = idMatches && idMatches.length > 1 ? idMatches[1] : null

                if (identifier) {
                    this.actionSetLinkToken(identifier)
                    return true
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
            }

            // Fallback to BreezSDK parsing
            const input = await breezSdk.parseInput(intent)

            switch (input.type) {
                case breezSdk.InputType.LNURL_AUTH:
                    const lnUrlAuthRequestData = input.data as breezSdk.LnUrlAuthRequestData
                    this.actionSetLnUrlAuthParams(lnUrlAuthRequestData)
                    return true
                case breezSdk.InputType.LNURL_PAY:
                    const lnUrlPayRequestData = input.data as breezSdk.LnUrlPayRequestData
                    this.actionSetLnUrlPayParams(lnUrlPayRequestData)
                    return true
                case breezSdk.InputType.LNURL_WITHDRAW:
                    const lnUrlWithdrawRequestData = input.data as breezSdk.LnUrlWithdrawRequestData
                    this.actionSetLnUrlWithdrawParams(lnUrlWithdrawRequestData)
                    return true
                case breezSdk.InputType.BOLT11:
                    const lnInvoice = input.data as breezSdk.LnInvoice
                    this.actionSetPaymentRequest(lnInvoice.bolt11, lnInvoice)
                    return true
            }
        } catch (error) {
            log.debug(`SAT085: Error parsing intent`, true)
            log.debug(JSON.stringify(error), true)
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

    setLinkToken(token?: string) {
        this.actionSetLinkToken(token)
    }

    async setPaymentRequest(paymentRequest: string) {
        assertNetwork(paymentRequest)
        const lnInvoice = await lightning.parseInvoice(paymentRequest)

        this.actionSetPaymentRequest(paymentRequest, lnInvoice)
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
        this.lnUrlPayParams = undefined
        this.lnUrlWithdrawParams = undefined
    }

    actionClearPaymentRequest() {
        this.paymentRequest = undefined
        this.lnInvoice = undefined
    }

    actionSetAppState(state: AppStateStatus) {
        log.debug(`SAT086: App state changed: ${state}`, true)
        this.appState = state
    }

    actionSetChargePoint(evse: EvseModel) {
        if (evse.location) {
            if (evse.connectors.length === 1) {
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

    actionSetLnUrlAuthParams(authParams: breezSdk.LnUrlAuthRequestData) {
        this.actionClearLnUrl()
        this.lnUrlAuthParams = authParams
    }

    actionSetLnUrlPayParams(payParams: breezSdk.LnUrlPayRequestData) {
        this.actionClearLnUrl()
        this.lnUrlPayParams = payParams
    }

    actionSetLnUrlWithdrawParams(withdrawParams: breezSdk.LnUrlWithdrawRequestData) {
        this.actionClearLnUrl()
        this.lnUrlWithdrawParams = withdrawParams
    }

    async actionSetPaymentRequest(paymentRequest: string, lnInvoice: breezSdk.LnInvoice) {
        this.lnInvoice = lnInvoice
        this.paymentRequest = paymentRequest
        log.debug(JSON.stringify(this.lnInvoice))
    }

    actionSetOnboarding(welcomed: boolean, version: string) {
        this.onboardingWelcomed = welcomed
        this.onboardingVersion = version
    }

    actionSetReady() {
        this.ready = true
    }

    actionSetTooltipShown({ backend, cards, circuit, syncing }: Tooltip) {
        if (backend) {
            this.tooltipShownBackend = true
        }

        if (cards) {
            this.tooltipShownCards = true
        }

        if (circuit) {
            this.tooltipShownCircuit = true
        }

        if (syncing) {
            this.tooltipShownSyncing = true
        }
    }

    reactionBackend() {
        if (this.stores.lightningStore.backend === LightningBackend.LND) {
            this.tooltipShownBackend = false
        }
    }
}
