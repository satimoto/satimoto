import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import ChannelRequestModel, { ChannelRequestModelLike } from "models/ChannelRequest"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { lnrpc } from "proto/proto"
import { StoreInterface, Store } from "stores/Store"
import { channelBalance, subscribeChannelEvents } from "services/LightningService"
import { toNumber } from "utils/conversion"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"

const log = new Log("ChannelStore")

export interface ChannelStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    channelRequests: ChannelRequestModel[]
    subscribedChannelEvents: boolean
    localBalance: number
    remoteBalance: number

    addChannelRequest(pubkey: string, paymentHash: string, amountMsat: string): void
}

export class ChannelStore implements ChannelStoreInterface {
    hydrated = false
    ready = false
    stores

    channelRequests
    subscribedChannelEvents = false
    localBalance = 0
    remoteBalance = 0

    constructor(stores: Store) {
        this.stores = stores
        this.channelRequests = observable<ChannelRequestModel>([])

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            channelRequests: observable,
            subscribedChannelEvents: observable,
            localBalance: observable,
            remoteBalance: observable,

            setReady: action,
            addChannelRequest: action,
            removeChannelRequest: action,
            updateChannelBalance: action,
            updateChannelEvents: action
        })

        makePersistable(
            this,
            { name: "ChannelStore", properties: ["localBalance", "remoteBalance"], storage: AsyncStorage, debugMode: DEBUG },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
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

    addChannelRequest(pubkey: string, paymentHash: string, pushAmount: string) {
        log.debug(`Add channel request: ${pubkey}, hash: ${paymentHash}, pushAmount ${pushAmount}`)
        this.channelRequests.push({
            pubkey,
            paymentHash,
            pushAmount
        })
    }

    findChannelRequest(pubkey: string, pushAmount: string): ChannelRequestModelLike {
        return this.channelRequests.find((channelRequest) => channelRequest.pubkey === pubkey && channelRequest.pushAmount === pushAmount)
    }

    removeChannelRequest(channelRequest: ChannelRequestModel) {
        this.channelRequests.remove(channelRequest)
    }

    updateChannelBalance({ balance, localBalance, remoteBalance }: lnrpc.ChannelBalanceResponse) {
        log.debug(`Channel Balance: ${balance}`)
        this.localBalance = localBalance && localBalance.sat ? toNumber(localBalance.sat) : 0
        this.remoteBalance = remoteBalance && remoteBalance.sat ? toNumber(remoteBalance.sat) : 0
    }

    updateChannelEvents({ type, openChannel }: lnrpc.ChannelEventUpdate) {
        log.debug(`Channel Event: ${type}`)
        this.getChannelBalance()

        if (type == lnrpc.ChannelEventUpdate.UpdateType.OPEN_CHANNEL && openChannel) {
            const remotePubkey = openChannel.remotePubkey
            const pushAmount = openChannel.pushAmountSat
            log.debug(`Remote pubkey: ${remotePubkey}, Push amount: ${pushAmount}`)

            if (remotePubkey && pushAmount) {
                const channelRequest = this.findChannelRequest(remotePubkey, pushAmount.toString())

                if (channelRequest) {
                    this.stores.invoiceStore.settleInvoice(channelRequest.paymentHash)
                    this.removeChannelRequest(channelRequest)
                }
            }
        }
    }
}
