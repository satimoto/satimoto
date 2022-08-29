import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import ChannelRequestModel, { ChannelRequestModelLike } from "models/ChannelRequest"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { lnrpc } from "proto/proto"
import { StoreInterface, Store } from "stores/Store"
import { ChannelAcceptor, channelAcceptor, channelBalance, subscribeChannelEvents } from "services/LightningService"
import { bytesToHex, toLong, toNumber } from "utils/conversion"
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

    channelAcceptor: ChannelAcceptor | null = null
    channelRequests
    subscribedChannelAcceptor = false
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
            subscribedChannelAcceptor: observable,
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
                () => this.subscribeChannelAcceptor()
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

    subscribeChannelAcceptor() {
        if (!this.channelAcceptor) {
            this.channelAcceptor = channelAcceptor((data: lnrpc.ChannelAcceptRequest) => this.updateChannelAcceptor(data))

            this.channelAcceptor.finally(() => {
                log.debug(`Channel Acceptor shutdown`)
                this.channelAcceptor = null
            })
        }
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

    addChannelRequest(pubkey: string, paymentHash: string, pendingChanId: string) {
        log.debug(`Add channel request: ${pubkey}, hash: ${paymentHash}, pendingChanId ${pendingChanId}`)
        this.channelRequests.push({
            pubkey,
            paymentHash,
            pendingChanId
        })
    }

    findChannelRequest(pubkey: string, pendingChanId?: string): ChannelRequestModelLike {
        return this.channelRequests.find(
            (channelRequest) => channelRequest.pubkey === pubkey && (!pendingChanId || channelRequest.pendingChanId === pendingChanId)
        )
    }

    removeChannelRequest(channelRequest: ChannelRequestModel) {
        this.channelRequests.remove(channelRequest)
    }

    updateChannelAcceptor({ nodePubkey, pendingChanId, wantsZeroConf }: lnrpc.ChannelAcceptRequest) {
        log.debug(`Channel Acceptor`)

        if (this.channelAcceptor) {
            const pubkey = bytesToHex(nodePubkey)
            log.debug(`Pubkey: ${pubkey}`)
            log.debug(`PendingChanId: ${pendingChanId}`)

            const channelRequest = this.findChannelRequest(pubkey)

            this.channelAcceptor.send({
                pendingChanId: pendingChanId,
                accept: !!channelRequest,
                zeroConf: wantsZeroConf
            })
        }
    }

    updateChannelBalance({ localBalance, remoteBalance, unsettledLocalBalance }: lnrpc.ChannelBalanceResponse) {
        const localBalanceSat = localBalance && localBalance.sat ? toNumber(localBalance.sat) : 0
        const remoteBalanceSat = remoteBalance && remoteBalance.sat ? toNumber(remoteBalance.sat) : 0
        const unsettledLocalBalanceSat = unsettledLocalBalance && unsettledLocalBalance.sat ? toNumber(unsettledLocalBalance.sat) : 0

        this.localBalance = localBalanceSat + unsettledLocalBalanceSat
        this.remoteBalance = remoteBalanceSat
        log.debug(`Channel Balance: ${this.localBalance}`)
    }

    updateChannelEvents({ type, openChannel }: lnrpc.ChannelEventUpdate) {
        log.debug(`Channel Event: ${type}`)
        this.getChannelBalance()

        if (type == lnrpc.ChannelEventUpdate.UpdateType.OPEN_CHANNEL && openChannel) {
            const remotePubkey = openChannel.remotePubkey
            log.debug(`Remote pubkey: ${remotePubkey}`)
            log.debug(`ChanID: ${openChannel.chanId}`)

            if (remotePubkey) {
                const channelRequest = this.findChannelRequest(remotePubkey)

                if (channelRequest) {
                    this.removeChannelRequest(channelRequest)
                }
            }
        }
    }
}
