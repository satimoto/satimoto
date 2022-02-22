import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { lnrpc } from "proto/proto"
import { IStore, Store } from "stores/Store"
import { channelBalance, subscribeChannelEvents } from "services/LightningService"
import { toNumber } from "utils/conversion"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"

const log = new Log("ChannelStore")

export interface IChannelStore extends IStore {
    hydrated: boolean
    stores: Store

    subscribedChannelEvents: boolean
    localBalance: number
    remoteBalance: number
}

export class ChannelStore implements IChannelStore {
    hydrated = false
    ready = false
    stores

    subscribedChannelEvents = false
    localBalance = 0
    remoteBalance = 0

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            subscribedChannelEvents: observable,
            localBalance: observable,
            remoteBalance: observable,

            setReady: action,
            updateChannelBalance: action,
            updateChannelEvents: action
        })

        makePersistable(this, { name: "ChannelStore", properties: [], storage: AsyncStorage, debugMode: DEBUG }, { delay: 1000 }).then(
            action((persistStore) => (this.hydrated = persistStore.isHydrated))
        )
    }

    async initialize(): Promise<void> {
        try {
            // When the synced to chain, subscribe to channel events
            when(
                () => this.stores.lightningStore.syncedToChain,
                () => this.subscribeChannelEvents()
            )

            when(
                () => this.stores.lightningStore.syncedToChain,
                () => this.getChannelBalance()
            )
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    async getChannelBalance() {
        const channelBalanceResponse: lnrpc.ChannelBalanceResponse = await channelBalance()
        this.updateChannelBalance(channelBalanceResponse)
    }

    subscribeChannelEvents() {
        if (!this.subscribedChannelEvents) {
            subscribeChannelEvents((data: lnrpc.ChannelEventUpdate) => this.updateChannelEvents(data))
            this.subscribedChannelEvents = true
        }
    }

    setReady() {
        this.ready = true
    }

    updateChannelBalance(data: lnrpc.ChannelBalanceResponse) {
        log.debug(`Channel Balance: ${data.balance}`)
        this.localBalance = toNumber(data.localBalance?.sat) || 0
        this.remoteBalance = toNumber(data.remoteBalance?.sat) || 0
    }

    updateChannelEvents({ type }: lnrpc.ChannelEventUpdate) {
        log.debug(`Channel Event: ${type}`)
        this.getChannelBalance()
    }
}
