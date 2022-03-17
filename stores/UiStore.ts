import { LNURLAuthParams, LNURLChannelParams, LNURLPayParams, LNURLWithdrawParams } from "js-lnurl"
import { action, makeObservable, observable, runInAction } from "mobx"
import { makePersistable } from "mobx-persist-store"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { StoreInterface, Store } from "stores/Store"
import { decodePayReq } from "services/LightningService"
import { getParams, getTag } from "services/LnUrlService"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"

const log = new Log("UiStore")

export interface UiStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    lnUrl?: string
    lnUrlAuthParams?: LNURLAuthParams
    lnUrlChannelParams?: LNURLChannelParams
    lnUrlPayParams?: LNURLPayParams
    lnUrlWithdrawParams?: LNURLWithdrawParams

    clearLnUrl(): void
    parseQrCode(qrCode: string): Promise<boolean>
    setLnUrlPayParams(payParams: LNURLPayParams): void
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

            setLnUrl: action,
            setLnUrlPayParams: action,
            clearLnUrl: action
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
        this.setReady()
    }

    setReady() {
        this.ready = true
    }

    /**
     * There are several different QR code data formats possible which need to be parsed.
     * LNURL: A LNURL spec string with various encoded request types
     * Payment Request: A Lightning payment request
     * Lightning Address: A static internet identifier
     * EVSE ID: A HTTP formatted EVSE ID used to locate a charge point
     * @param qrCode: Raw QR code to be parsed
     * @returns Promise<boolean>: The QR code is valid and parsed
     */
    async parseQrCode(qrCode: string): Promise<boolean> {
        log.debug("parseQrCode: " + qrCode)
        qrCode = qrCode.replace(/lightning:/i, "")
        const lowerCaseQrCode = qrCode.toLowerCase()

        if (lowerCaseQrCode.startsWith("lnurl")) {
            // LNURL
            return await this.setLnUrl(qrCode)
        } else if (qrCode.includes("@")) {
            // TODO: Static internet identifier
        } else if (lowerCaseQrCode.startsWith("http")) {
            // TODO: EVSE ID
        } else {
            // Payment Request
            this.stores.paymentStore.setPaymentRequest(qrCode)
        }

        return false
    }

    async setLnUrl(lnUrl: string): Promise<boolean> {
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

        return !!this.lnUrlChannelParams || !!this.lnUrlAuthParams || !!this.lnUrlPayParams || !!this.lnUrlWithdrawParams
    }

    setLnUrlPayParams(payParams: LNURLPayParams) {
        this.clearLnUrl()
        this.lnUrlPayParams = payParams
    }

    clearLnUrl() {
        this.lnUrl = undefined
        this.lnUrlAuthParams = undefined
        this.lnUrlChannelParams = undefined
        this.lnUrlPayParams = undefined
        this.lnUrlWithdrawParams = undefined
    }
}
