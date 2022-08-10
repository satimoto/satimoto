import { LNURLAuthParams, LNURLChannelParams, LNURLPayParams, LNURLWithdrawParams } from "js-lnurl"
import { action, makeObservable, observable, runInAction } from "mobx"
import { makePersistable } from "mobx-persist-store"
import { lnrpc } from "proto/proto"
import { Linking } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { StoreInterface, Store } from "stores/Store"
import { decodePayReq } from "services/LightningService"
import { getParams, getTag, identifier } from "services/LnUrlService"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"
import { assertNetwork } from "utils/assert"

const log = new Log("UiStore")

export interface UiStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    lnUrl?: string
    lnUrlAuthParams?: LNURLAuthParams
    lnUrlChannelParams?: LNURLChannelParams
    lnUrlPayParams?: LNURLPayParams
    lnUrlWithdrawParams?: LNURLWithdrawParams
    paymentRequest?: string
    decodedPaymentRequest?: lnrpc.PayReq

    clearLnUrl(): void
    clearPaymentRequest(): void
    parseIntent(intent: string): Promise<boolean>
    setLightningAddress(address: string): void
    setLnUrlPayParams(payParams: LNURLPayParams): void
    setPaymentRequest(paymentRequest: string): void
}

export class UiStore implements UiStoreInterface {
    hydrated = false
    ready = false
    stores

    lnUrl?: string = undefined
    lnUrlAuthParams?: LNURLAuthParams = undefined
    lnUrlChannelParams?: LNURLChannelParams = undefined
    lnUrlPayParams?: LNURLPayParams = undefined
    lnUrlWithdrawParams?: LNURLWithdrawParams = undefined
    paymentRequest?: string = undefined
    decodedPaymentRequest?: lnrpc.PayReq = undefined

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            lnUrl: observable,
            lnUrlAuthParams: observable,
            lnUrlChannelParams: observable,
            lnUrlPayParams: observable,
            lnUrlWithdrawParams: observable,
            paymentRequest: observable,
            decodedPaymentRequest: observable,

            setLnUrl: action,
            setLnUrlPayParams: action,
            setPaymentRequest: action,
            clearLnUrl: action,
            clearPaymentRequest: action
        })

        makePersistable(
            this,
            {
                name: "UiStore",
                properties: [],
                storage: AsyncStorage,
                debugMode: DEBUG
            },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    async initialize(): Promise<void> {
        const intent = await Linking.getInitialURL()

        if (intent) {
            this.parseIntent(intent)
        }

        this.setReady()
    }

    setReady() {
        this.ready = true
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
                // TODO: EVSE ID
            } else {
                // Payment Request
                await this.setPaymentRequest(intent)
                return true
            }
        } catch {}

        return false
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
            this.decodedPaymentRequest = decodedPaymentRequest
            this.paymentRequest = paymentRequest
            log.debug(JSON.stringify(this.decodedPaymentRequest))
        })
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
}
