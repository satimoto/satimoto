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
import { createChannelRequest, CreateChannelRequestInput } from "services/SatimotoService"
import { ChannelRequestStatus } from "types/channelRequest"

const log = new Log("ChannelStore")

export interface ChannelStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    channelRequestStatus: ChannelRequestStatus
    channelRequests: ChannelRequestModel[]
    subscribedChannelEvents: boolean
    localBalance: number
    remoteBalance: number

    createChannelRequest(channelRequest: CreateChannelRequestInput): Promise<lnrpc.IHopHint>
}

export class ChannelStore implements ChannelStoreInterface {
    hydrated = false
    ready = false
    stores

    channelRequestStatus = ChannelRequestStatus.IDLE
    channelAcceptor: ChannelAcceptor | null = null
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

            channelRequestStatus: observable,
            channelRequests: observable,
            subscribedChannelEvents: observable,
            localBalance: observable,
            remoteBalance: observable,

            setReady: action,
            addChannelRequest: action,
            removeChannelRequest: action,
            updateChannelRequestStatus: action,
            updateChannelBalance: action,
            onChannelEventUpdate: action
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

    cancelChannelAcceptor() {
        if (this.channelAcceptor) {
            this.channelAcceptor.cancel()
            this.channelAcceptor = null
        }
    }

    async getChannelBalance() {
        const channelBalanceResponse: lnrpc.ChannelBalanceResponse = await channelBalance()
        this.updateChannelBalance(channelBalanceResponse)
    }

    addChannelRequest(channelRequest: ChannelRequestModel) {
        log.debug(
            `Add channel request: ${channelRequest.pubkey}, hash: ${channelRequest.paymentHash}, pendingChanId ${channelRequest.pendingChanId}, scid ${channelRequest.scid}`
        )
        this.channelRequestStatus = ChannelRequestStatus.IDLE
        this.channelRequests.push(channelRequest)
    }

    async createChannelRequest(input: CreateChannelRequestInput): Promise<lnrpc.IHopHint> {
        const channelRequest = await createChannelRequest(input)
        const { node, pendingChanId, scid, feeBaseMsat, feeProportionalMillionths, cltvExpiryDelta } = channelRequest.data.createChannelRequest
        const peer = await this.stores.peerStore.connectPeer(node.pubkey, node.addr)
        const hopHint: lnrpc.IHopHint = {
            nodeId: peer.pubkey,
            chanId: toLong(scid),
            feeBaseMsat,
            feeProportionalMillionths,
            cltvExpiryDelta
        }

        this.addChannelRequest({ pubkey: node.pubkey, paymentHash: bytesToHex(input.paymentHash), pendingChanId, scid })
        this.subscribeChannelAcceptor()

        return hopHint
    }

    findChannelRequest(pubkey: string, pendingChanId?: string): ChannelRequestModelLike {
        return this.channelRequests.find(
            (channelRequest) => channelRequest.pubkey === pubkey && (!pendingChanId || channelRequest.pendingChanId === pendingChanId)
        )
    }

    onChannelAcceptRequest({ nodePubkey, pendingChanId, wantsZeroConf }: lnrpc.ChannelAcceptRequest) {
        log.debug(`Channel Acceptor`)

        if (this.channelAcceptor) {
            const pubkey = bytesToHex(nodePubkey)
            log.debug(`Pubkey: ${pubkey}`)
            log.debug(`PendingChanId: ${pendingChanId}`)

            const channelRequest = this.findChannelRequest(pubkey)

            if (channelRequest) {
                this.updateChannelRequestStatus(ChannelRequestStatus.NEGOTIATING)
            }

            this.channelAcceptor.send({
                pendingChanId: pendingChanId,
                accept: !!channelRequest,
                zeroConf: wantsZeroConf
            })
        }
    }

    onChannelEventUpdate({ type, openChannel }: lnrpc.ChannelEventUpdate) {
        log.debug(`Channel Event: ${type}`)
        this.getChannelBalance()

        if (type == lnrpc.ChannelEventUpdate.UpdateType.OPEN_CHANNEL && openChannel) {
            const remotePubkey = openChannel.remotePubkey
            log.debug(`Remote pubkey: ${remotePubkey}`)
            log.debug(`ChanID: ${openChannel.chanId}`)

            if (remotePubkey) {
                const channelRequest = this.findChannelRequest(remotePubkey)

                if (channelRequest) {
                    this.updateChannelRequestStatus(ChannelRequestStatus.OPENED)
                    this.removeChannelRequest(channelRequest)
                    this.cancelChannelAcceptor()
                }
            }
        }
    }

    removeChannelRequest(channelRequest: ChannelRequestModel) {
        this.channelRequests.remove(channelRequest)
    }

    setReady() {
        this.ready = true
    }

    subscribeChannelAcceptor() {
        this.cancelChannelAcceptor()

        this.channelAcceptor = channelAcceptor((data: lnrpc.ChannelAcceptRequest) => this.onChannelAcceptRequest(data))

        this.channelAcceptor.finally(() => {
            log.debug(`Channel Acceptor shutdown`)
            this.channelAcceptor = null
        })
    }

    subscribeChannelEvents() {
        if (!this.subscribedChannelEvents) {
            subscribeChannelEvents((data: lnrpc.ChannelEventUpdate) => this.onChannelEventUpdate(data))
            this.subscribedChannelEvents = true
        }
    }

    updateChannelRequestStatus(status: ChannelRequestStatus) {
        this.channelRequestStatus = status
    }

    updateChannelBalance({ localBalance, remoteBalance, unsettledLocalBalance }: lnrpc.ChannelBalanceResponse) {
        const localBalanceSat = localBalance && localBalance.sat ? toNumber(localBalance.sat) : 0
        const remoteBalanceSat = remoteBalance && remoteBalance.sat ? toNumber(remoteBalance.sat) : 0
        const unsettledLocalBalanceSat = unsettledLocalBalance && unsettledLocalBalance.sat ? toNumber(unsettledLocalBalance.sat) : 0

        this.localBalance = localBalanceSat + unsettledLocalBalanceSat
        this.remoteBalance = remoteBalanceSat
        log.debug(`Channel Balance: ${this.localBalance}`)
    }
}
