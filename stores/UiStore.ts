import { action, makeObservable, observable } from "mobx"
import { makePersistable } from "mobx-persist-store"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { StoreInterface, Store } from "stores/Store"
import { getParams, getTag } from "services/LnUrlService"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"
import { LNURLAuthParams, LNURLChannelParams, LNURLPayParams, LNURLWithdrawParams } from "js-lnurl"

const log = new Log("UiStore")

export interface UiStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    lnUrl?: string
    lnUrlAuthParams?: LNURLAuthParams
    lnUrlChannelParams?: LNURLChannelParams
    lnUrlPayParams?: LNURLPayParams
    lnUrlWithdrawParams?: LNURLWithdrawParams

    setLnUrl(lnUrl: string): void
    clearLnUrl(): void
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

    async setLnUrl(lnUrl: string) {
        this.clearLnUrl()
        this.lnUrl = lnUrl

        const params = await getParams(lnUrl)
        const tag = getTag(params)

        if (tag === "channelRequest") {
            this.lnUrlChannelParams = params as LNURLChannelParams
        } else if (tag === "login") {
            this.lnUrlAuthParams = params as LNURLAuthParams
        } else if (tag === "payRequest") {
            this.lnUrlPayParams = params as LNURLPayParams
        } else if (tag === "withdrawRequest") {
            this.lnUrlWithdrawParams = params as LNURLWithdrawParams
        }
    }

    clearLnUrl() {
        this.lnUrl = undefined
        this.lnUrlAuthParams = undefined
        this.lnUrlChannelParams = undefined
        this.lnUrlPayParams = undefined
        this.lnUrlWithdrawParams = undefined
    }
}
