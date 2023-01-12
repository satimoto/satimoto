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
    lastActiveTimestamp: string
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
    lastActiveTimestamp: string = ""
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
            lastActiveTimestamp: observable,
            subscribedChannelEvents: observable,
            localBalance: observable,
            remoteBalance: observable,

            actionSetReady: action,
            actionAddChannelRequest: action,
            actionChannelEventReceived: action,
            actionRemoveChannelRequest: action,
            actionUpdateChannelRequestStatus: action,
            actionUpdateChannelBalance: action
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
                () => this.whenSyncedToChain()
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
        this.actionUpdateChannelBalance(channelBalanceResponse)
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

        this.actionAddChannelRequest({ pubkey: node.pubkey, paymentHash: bytesToHex(input.paymentHash), pendingChanId, scid })
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
                this.actionUpdateChannelRequestStatus(ChannelRequestStatus.NEGOTIATING)
            }

            this.channelAcceptor.send({
                pendingChanId: pendingChanId,
                accept: !!channelRequest,
                zeroConf: wantsZeroConf
            })
        }
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
            subscribeChannelEvents((data: lnrpc.ChannelEventUpdate) => this.actionChannelEventReceived(data))
            this.subscribedChannelEvents = true
        }
    }

    /*
     * Mobx actions and reactions
     */

    actionAddChannelRequest(channelRequest: ChannelRequestModel) {
        log.debug(
            `Add channel request: ${channelRequest.pubkey}, hash: ${channelRequest.paymentHash}, pendingChanId ${channelRequest.pendingChanId}, scid ${channelRequest.scid}`
        )
        this.channelRequestStatus = ChannelRequestStatus.IDLE
        this.channelRequests.push(channelRequest)
    }
    
    actionChannelEventReceived({ type, openChannel }: lnrpc.ChannelEventUpdate) {
        log.debug(`Channel Event: ${type}`)

        if (type == lnrpc.ChannelEventUpdate.UpdateType.OPEN_CHANNEL && openChannel) {
            const remotePubkey = openChannel.remotePubkey
            log.debug(`Remote pubkey: ${remotePubkey}`)
            log.debug(`ChanID: ${openChannel.chanId}`)

            if (remotePubkey) {
                const channelRequest = this.findChannelRequest(remotePubkey)

                if (channelRequest) {
                    this.actionUpdateChannelRequestStatus(ChannelRequestStatus.OPENED)
                    this.actionRemoveChannelRequest(channelRequest)
                    this.cancelChannelAcceptor()
                }
            }
        } else if (type == lnrpc.ChannelEventUpdate.UpdateType.ACTIVE_CHANNEL) {
            this.getChannelBalance()
            this.lastActiveTimestamp = new Date().toISOString()
        }
    }

    actionRemoveChannelRequest(channelRequest: ChannelRequestModel) {
        this.channelRequests.remove(channelRequest)
    }

    actionSetReady() {
        this.ready = true
    }

    actionUpdateChannelRequestStatus(status: ChannelRequestStatus) {
        this.channelRequestStatus = status
    }

    actionUpdateChannelBalance({ localBalance, remoteBalance, unsettledLocalBalance }: lnrpc.ChannelBalanceResponse) {
        const localBalanceSat = localBalance && localBalance.sat ? toNumber(localBalance.sat) : 0
        const remoteBalanceSat = remoteBalance && remoteBalance.sat ? toNumber(remoteBalance.sat) : 0
        const unsettledLocalBalanceSat = unsettledLocalBalance && unsettledLocalBalance.sat ? toNumber(unsettledLocalBalance.sat) : 0

        this.localBalance = localBalanceSat + unsettledLocalBalanceSat
        this.remoteBalance = remoteBalanceSat
        log.debug(`Channel Balance: ${this.localBalance}`)
    }

    async whenSyncedToChain() {
        this.subscribeChannelEvents()
        this.getChannelBalance()
    }
}
