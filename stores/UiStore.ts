import { LNURLAuthParams, LNURLChannelParams, LNURLPayParams, LNURLWithdrawParams } from "js-lnurl"
import { action, computed, makeObservable, observable, runInAction, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import ConnectorModel from "models/Connector"
import EvseModel from "models/Evse"
import LocationModel from "models/Location"
import { lnrpc } from "proto/proto"
import { Linking } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import NfcManager from "react-native-nfc-manager"
import { StoreInterface, Store } from "stores/Store"
import { decodePayReq } from "services/LightningService"
import { getParams, getTag, identifier } from "services/LnUrlService"
import { assertNetwork } from "utils/assert"
import { DEBUG } from "utils/build"
import { ONBOARDING_VERSION } from "utils/constants"
import { Log } from "utils/logging"
import { PayReq, toPayReq } from "types/payment"

const log = new Log("UiStore")
const EVSE_ID_REGEX = /[A-Za-z]{2}[*-]?[A-Za-z0-9]{3}[*-]?[eE]{1}[\w*-]+/

export interface UiStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    connector?: ConnectorModel
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

    clearChargePoint(): void
    clearLnUrl(): void
    clearPaymentRequest(): void
    parseIntent(intent: string): Promise<boolean>
    setChargePoint(connector: ConnectorModel): void
    setLightningAddress(address: string): void
    setLnUrlPayParams(payParams: LNURLPayParams): void
    setPaymentRequest(paymentRequest: string): void
}

export class UiStore implements UiStoreInterface {
    hydrated = false
    ready = false
    stores

    connector?: ConnectorModel = undefined
    evse?: EvseModel = undefined
    location?: LocationModel = undefined
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

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            connector: observable,
            evse: observable,
            location: observable,
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

            hasOnboardingUpdates: computed,

            clearChargePoint: action,
            clearLnUrl: action,
            clearPaymentRequest: action,
            setChargePoint: action,
            setLnUrl: action,
            setLnUrlPayParams: action,
            setPaymentRequest: action,
            setOnboarding: action
        })

        makePersistable(
            this,
            {
                name: "UiStore",
                properties: [
                    "connector",
                    "evse",
                    "location",
                    "lnUrl",
                    "lnUrlAuthParams",
                    "lnUrlChannelParams",
                    "lnUrlPayParams",
                    "lnUrlWithdrawParams",
                    "paymentRequest",
                    "decodedPaymentRequest",
                    "onboardingWelcomed",
                    "onboardingVersion"
                ],
                storage: AsyncStorage,
                debugMode: DEBUG
            },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    async initialize(): Promise<void> {
        when(
            () => this.hydrated,
            () => this.onHydrated()
        )

        this.setReady()
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
        this.connector = undefined
        this.evse = undefined
        this.location = undefined
    }

    clearLnUrl() {
        this.lnUrl = undefined
        this.lnUrlAuthParams = undefined
        this.lnUrlChannelParams = undefined
        this.lnUrlPayParams = undefined
        this.lnUrlWithdrawParams = undefined
    }

    clearPaymentRequest() {
        this.paymentRequest = undefined
        this.decodedPaymentRequest = undefined
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
        intent = intent.replace(/lightning:/i, "")
        const lowerCaseIntent = intent.toLowerCase()

        try {
            if (lowerCaseIntent.startsWith("lnurl")) {
                // LNURL
                await this.setLnUrl(intent)
                return true
            } else if (intent.includes("@")) {
                // Lightning Address
                await this.setLightningAddress(intent)
                return true
            } else if (lowerCaseIntent.startsWith("http")) {
                // URL, Charge Point identifier
                const indentifierMatches = lowerCaseIntent.match(EVSE_ID_REGEX)

                if (indentifierMatches && indentifierMatches.length > 0) {
                    const connector = await this.stores.locationStore.searchConnector(indentifierMatches[0])

                    if (connector) {
                        this.setChargePoint(connector)
                    }
                }

                return false
            } else {
                // Payment Request
                await this.setPaymentRequest(intent)
                return true
            }
        } catch {}

        return false
    }

    setChargePoint(connector: ConnectorModel) {
        this.connector = connector
        this.evse = this.connector.evse
        this.location = this.evse?.location
    }

    async setLightningAddress(address: string) {
        const payParams = await identifier(address)
        this.setLnUrlPayParams(payParams)
    }

    async setLnUrl(lnUrl: string) {
        this.clearLnUrl()

        const params = await getParams(lnUrl)
        const tag = getTag(params)

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

    setLnUrlPayParams(payParams: LNURLPayParams) {
        this.clearLnUrl()
        this.lnUrlPayParams = payParams
    }

    async setPaymentRequest(paymentRequest: string) {
        assertNetwork(paymentRequest)
        const decodedPaymentRequest = await decodePayReq(paymentRequest)

        runInAction(() => {
            this.decodedPaymentRequest = toPayReq(decodedPaymentRequest)
            this.paymentRequest = paymentRequest
            log.debug(JSON.stringify(this.decodedPaymentRequest))
        })
    }

    setReady() {
        this.ready = true
    }

    setOnboarding(welcomed: boolean, version: string) {
        this.onboardingWelcomed = welcomed
        this.onboardingVersion = version
    }
}
