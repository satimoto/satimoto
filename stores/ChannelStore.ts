import { action, computed, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import ChannelModel, { ChannelModelLike } from "models/Channel"
import ChannelRequestModel, { ChannelRequestModelLike } from "models/ChannelRequest"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { lnrpc } from "proto/proto"
import { StoreInterface, Store } from "stores/Store"
import {
    CloseChannelProps,
    ChannelAcceptor,
    channelAcceptor,
    channelBalance,
    closeChannel,
    listChannels,
    subscribeChannelEvents,
    closedChannels
} from "services/LightningService"
import { bytesToHex, reverseByteOrder, toLong, toNumber } from "utils/conversion"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"
import { createChannelRequest, CreateChannelRequestInput } from "services/SatimotoService"
import { ChannelRequestStatus } from "types/channelRequest"
import { ChannelModelUpdate, toChannel } from "types/channel"
import { isValue } from "utils/null"

const log = new Log("ChannelStore")

export interface ChannelStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    channels: ChannelModel[]
    channelRequestStatus: ChannelRequestStatus
    channelRequests: ChannelRequestModel[]
    lastActiveTimestamp: number
    subscribedChannelEvents: boolean
    localBalance: number
    remoteBalance: number
    reservedBalance: number

    closeChannel(request: CloseChannelProps): Promise<ChannelModel>
    createChannelRequest(channelRequest: CreateChannelRequestInput): Promise<lnrpc.IHopHint>
}

export class ChannelStore implements ChannelStoreInterface {
    hydrated = false
    ready = false
    stores

    channelRequestStatus = ChannelRequestStatus.IDLE
    channelAcceptor: ChannelAcceptor | null = null
    channels
    channelRequests
    lastActiveTimestamp = 0
    subscribedChannelEvents = false
    localBalance = 0
    remoteBalance = 0
    reservedBalance = 0

    constructor(stores: Store) {
        this.stores = stores
        this.channels = observable<ChannelModel>([])
        this.channelRequests = observable<ChannelRequestModel>([])

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            channels: observable,
            channelRequestStatus: observable,
            channelRequests: observable,
            lastActiveTimestamp: observable,
            subscribedChannelEvents: observable,
            localBalance: observable,
            remoteBalance: observable,
            reservedBalance: observable,

            availableBalance: computed,
            balance: computed,

            actionSetReady: action,
            actionAddChannelRequest: action,
            actionChannelEventReceived: action,
            actionRemoveChannelRequest: action,
            actionUpdateChannel: action,
            actionUpdateChannelByChannelPoint: action,
            actionUpdateChannelRequestStatus: action,
            actionUpdateChannelBalance: action,
            actionUpdateChannels: action,
            actionUpdateClosedChannels: action
        })

        makePersistable(
            this,
            {
                name: "ChannelStore",
                properties: ["channels", "localBalance", "remoteBalance", "reservedBalance"],
                storage: AsyncStorage,
                debugMode: DEBUG
            },
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
            log.error(`SAT033: Error Initializing: ${error}`, true)
        }
    }

    get availableBalance(): number {
        return Math.max(0, this.localBalance - this.reservedBalance)
    }

    get balance(): number {
        return this.stores.settingStore.includeChannelReserve ? this.localBalance : this.availableBalance
    }

    cancelChannelAcceptor() {
        if (this.channelAcceptor) {
            this.channelAcceptor.cancel()
            this.channelAcceptor = null
        }
    }

    closeChannel(request: CloseChannelProps): Promise<ChannelModel> {
        return new Promise<ChannelModel>(async (resolve, reject) => {
            try {
                await closeChannel(async ({ closePending }: lnrpc.CloseStatusUpdate) => {
                    if (closePending && closePending.txid) {
                        const channel = this.actionUpdateChannelByChannelPoint({
                            fundingTxid: request.channelPoint.fundingTxidStr!,
                            outputIndex: request.channelPoint.outputIndex!,
                            isActive: false,
                            closingTxid: bytesToHex(reverseByteOrder(closePending.txid))
                        })

                        if (channel) {
                            return resolve(channel)
                        }

                        reject()
                    }
                }, request)
            } catch (error) {
                reject(error)
            }
        })
    }

    async getChannelBalance() {
        const channelBalanceResponse: lnrpc.ChannelBalanceResponse = await channelBalance()
        this.actionUpdateChannelBalance(channelBalanceResponse)
    }

    async getChannels() {
        const listChannelsResponse: lnrpc.ListChannelsResponse = await listChannels({})
        this.actionUpdateChannels(listChannelsResponse)
    }

    async getClosedChannels() {
        const closedChannelsResponse: lnrpc.ClosedChannelsResponse = await closedChannels({})
        this.actionUpdateClosedChannels(closedChannelsResponse)
    }

    getChannel(channelPoint: string): ChannelModelLike {
        return this.channels.find((channel) => channel.channelPoint === channelPoint)
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
        log.debug(`SAT034: Channel Acceptor`, true)

        if (this.channelAcceptor) {
            const pubkey = bytesToHex(nodePubkey)
            log.debug(`SAT034: Pubkey: ${pubkey}`, true)
            log.debug(`SAT034: PendingChanId: ${pendingChanId}`, true)

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
            log.debug(`SAT035: Channel Acceptor shutdown`, true)
            this.channelAcceptor = null
        })
    }

    subscribeChannelEvents() {
        if (!this.subscribedChannelEvents) {
            subscribeChannelEvents((data: lnrpc.ChannelEventUpdate) => this.actionChannelEventReceived(data))
            this.subscribedChannelEvents = true
        }
    }

    async updateChannels() {
        await this.getChannelBalance()
        await this.getChannels()
        await this.getClosedChannels()
    }

    /*
     * Mobx actions and reactions
     */

    actionAddChannelRequest(channelRequest: ChannelRequestModel) {
        log.debug(
            `SAT036: Add channel request: ${channelRequest.pubkey}, ` +
                `hash: ${channelRequest.paymentHash}, ` +
                `pendingChanId ${channelRequest.pendingChanId}, ` +
                `scid ${channelRequest.scid}`,
            true
        )
        this.channelRequestStatus = ChannelRequestStatus.IDLE
        this.channelRequests.push(channelRequest)
    }

    async actionChannelEventReceived({
        type,
        activeChannel,
        inactiveChannel,
        openChannel,
        closedChannel,
        fullyResolvedChannel
    }: lnrpc.ChannelEventUpdate) {
        log.debug(`SAT037: Channel Event: ${type}`, true)

        if (type == lnrpc.ChannelEventUpdate.UpdateType.OPEN_CHANNEL && openChannel) {
            const remotePubkey = openChannel.remotePubkey
            log.debug(`SAT038: Remote pubkey: ${remotePubkey}`, true)
            log.debug(`SAT038: ChanID: ${openChannel.chanId}`, true)

            if (remotePubkey) {
                const channelRequest = this.findChannelRequest(remotePubkey)

                if (channelRequest) {
                    this.actionUpdateChannelRequestStatus(ChannelRequestStatus.OPENED)
                    this.actionRemoveChannelRequest(channelRequest)
                    this.cancelChannelAcceptor()
                }
            }
        } else if (type == lnrpc.ChannelEventUpdate.UpdateType.ACTIVE_CHANNEL && activeChannel) {
            const timestamp = new Date().getTime()

            if (this.lastActiveTimestamp < timestamp - 10000) {
                this.updateChannels()
            } else if (isValue(activeChannel.fundingTxidStr) && isValue(activeChannel.outputIndex)) {
                this.actionUpdateChannelByChannelPoint({
                    fundingTxid: activeChannel.fundingTxidStr!,
                    outputIndex: activeChannel.outputIndex!,
                    isActive: true
                })
            }

            this.lastActiveTimestamp = timestamp
        } else if (type == lnrpc.ChannelEventUpdate.UpdateType.INACTIVE_CHANNEL && inactiveChannel) {
            if (isValue(inactiveChannel.fundingTxidStr) && isValue(inactiveChannel.outputIndex)) {
                this.actionUpdateChannelByChannelPoint({
                    fundingTxid: inactiveChannel.fundingTxidStr!,
                    outputIndex: inactiveChannel.outputIndex!,
                    isActive: false
                })
            }
        } else if (type == lnrpc.ChannelEventUpdate.UpdateType.CLOSED_CHANNEL && closedChannel) {
            if (isValue(closedChannel.channelPoint)) {
                this.actionUpdateChannelByChannelPoint({
                    channelPoint: closedChannel.channelPoint!,
                    isClosed: true
                })
            }

            this.updateChannels()
        } else if (type == lnrpc.ChannelEventUpdate.UpdateType.FULLY_RESOLVED_CHANNEL && fullyResolvedChannel) {
            if (isValue(fullyResolvedChannel.fundingTxidStr) && isValue(fullyResolvedChannel.outputIndex)) {
                this.actionUpdateChannelByChannelPoint({
                    fundingTxid: fullyResolvedChannel.fundingTxidStr!,
                    outputIndex: fullyResolvedChannel.outputIndex!,
                    isClosed: true
                })
            }

            this.updateChannels()
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
        log.debug(`SAT039: Channel Balance: ${this.localBalance}`, true)
    }

    actionUpdateChannel(channel: ChannelModel): ChannelModel {
        let existingChannel = this.channels.find(({ channelPoint }) => channelPoint === channel.channelPoint)

        if (existingChannel) {
            Object.assign(existingChannel, channel)

            return existingChannel
        } else {
            this.channels.push(channel)
        }

        return channel
    }

    actionUpdateChannelByChannelPoint({
        channelPoint,
        fundingTxid,
        outputIndex,
        isActive,
        isClosed,
        closingTxid
    }: ChannelModelUpdate): ChannelModelLike {
        channelPoint = channelPoint || `${fundingTxid}:${outputIndex}`
        let channel = this.getChannel(channelPoint)

        if (channel) {
            channel.isActive = isValue(isActive) ? isActive! : channel.isActive
            channel.isClosed = isValue(isClosed) ? isClosed! : channel.isClosed
            channel.closingTxid = isValue(closingTxid) ? closingTxid! : channel.closingTxid
        }

        return channel
    }

    actionUpdateChannels(listChannels: lnrpc.ListChannelsResponse) {
        let reserved = 0

        for (const iChannel of listChannels.channels) {
            reserved += toNumber(iChannel.localConstraints?.chanReserveSat || 0)

            this.actionUpdateChannel(toChannel(iChannel))
        }

        this.reservedBalance = reserved
        log.debug(`SAT040: Channel Reserve: ${this.reservedBalance}`, true)
    }

    actionUpdateClosedChannels(closedChannels: lnrpc.ClosedChannelsResponse) {
        for (const channelCloseSummary of closedChannels.channels) {
            if (channelCloseSummary.channelPoint) {
                let channel = this.getChannel(channelCloseSummary.channelPoint)

                if (channel) {
                    channel.closingTxid = channelCloseSummary.closingTxHash ? channelCloseSummary.closingTxHash : channel.closingTxid
                    channel.isClosed = true
                }
            }
        }
    }

    async whenSyncedToChain() {
        this.subscribeChannelEvents()
        this.updateChannels()
    }
}
