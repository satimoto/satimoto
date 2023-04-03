import { action, computed, makeObservable, observable, reaction, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import ChannelModel, { ChannelModelLike } from "models/Channel"
import ChannelRequestModel, { ChannelRequestModelLike } from "models/ChannelRequest"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as breezSdk from "react-native-breez-sdk"
import { lnrpc } from "proto/proto"
import { StoreInterface, Store } from "stores/Store"
import * as lnd from "services/lnd"
import { createChannelRequest, CreateChannelRequestInput } from "services/satimoto"
import { ChannelRequestStatus } from "types/channelRequest"
import { ChannelModelUpdate, toChannel } from "types/channel"
import { LightningBackend } from "types/lightningBackend"
import { bytesToHex, reverseByteOrder, toLong, toNumber, toSatoshi } from "utils/conversion"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"
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
    lspName: string
    lspFeePpmyraid: number
    lspFeeMinimum: number

    calculateOpeningFee(amountSats: number): number
    closeChannel(request: lnd.CloseChannelProps): Promise<ChannelModel>
    createChannelRequest(channelRequest: CreateChannelRequestInput): Promise<lnrpc.IHopHint>
}

export class ChannelStore implements ChannelStoreInterface {
    hydrated = false
    ready = false
    stores

    channelRequestStatus = ChannelRequestStatus.IDLE
    channelAcceptor: lnd.ChannelAcceptor | null = null
    channels
    channelRequests
    lastActiveTimestamp = 0
    subscribedChannelEvents = false
    localBalance = 0
    remoteBalance = 0
    reservedBalance = 0
    lspName = "Satimoto LSP"
    lspFeePpmyraid = 0
    lspFeeMinimum = 0

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
            lspName: observable,
            lspFeeMinimum: observable,
            lspFeePpmyraid: observable,

            availableBalance: computed,
            balance: computed,

            actionSetReady: action,
            actionAddChannelRequest: action,
            actionChannelEventReceived: action,
            actionRemoveChannelRequest: action,
            actionResetChannels: action,
            actionUpdateLspInfo: action,
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
            reaction(
                () => [this.stores.lightningStore.blockHeight],
                () => this.reactionBlockHeight()
            )

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

    calculateOpeningFee(amountSats: number): number {
        const openingFee = (amountSats * this.lspFeePpmyraid) / 10000

        return Math.max(this.lspFeeMinimum, openingFee)
    }

    cancelChannelAcceptor() {
        if (this.channelAcceptor) {
            this.channelAcceptor.cancel()
            this.channelAcceptor = null
        }
    }

    closeChannel(request: lnd.CloseChannelProps): Promise<ChannelModel> {
        return new Promise<ChannelModel>(async (resolve, reject) => {
            try {
                await lnd.closeChannel(async ({ closePending, chanClose }: lnrpc.CloseStatusUpdate) => {
                    const txid = closePending ? closePending.txid : chanClose ? chanClose.closingTxid : null

                    if (txid) {
                        const channel = this.actionUpdateChannelByChannelPoint({
                            fundingTxid: request.channelPoint.fundingTxidStr!,
                            outputIndex: request.channelPoint.outputIndex!,
                            isActive: false,
                            isClosed: !!chanClose,
                            closingTxid: bytesToHex(reverseByteOrder(txid))
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
        if (this.stores.lightningStore.backend === LightningBackend.BREEZ_SDK) {
            const { inboundLiquidityMsats, maxPayableMsat, maxReceivableMsat, maxChanReserveMsats, maxSinglePaymentAmountMsat } = await breezSdk.nodeInfo()
            const inboundLiquidity = toNumber(toSatoshi(inboundLiquidityMsats))
            const maxPayable = toNumber(toSatoshi(maxPayableMsat))
            const maxChanReserve = toNumber(toSatoshi(maxChanReserveMsats))

            log.debug(`SAT064: max receivable ${maxReceivableMsat}, single payment ${maxSinglePaymentAmountMsat}`, true)
            this.actionUpdateChannelBalance(maxPayable, inboundLiquidity, maxChanReserve)
        } else if (this.stores.lightningStore.backend === LightningBackend.LND) {
            const { localBalance, remoteBalance, unsettledLocalBalance }: lnrpc.ChannelBalanceResponse = await lnd.channelBalance()
            const localBalanceSat = localBalance ? toNumber(localBalance.sat || 0) : this.localBalance
            const remoteBalanceSat = remoteBalance ? toNumber(remoteBalance.sat || 0) : this.remoteBalance
            const unsettledLocalBalanceSat = unsettledLocalBalance ? toNumber(unsettledLocalBalance.sat || 0) : 0

            this.actionUpdateChannelBalance(localBalanceSat + unsettledLocalBalanceSat, remoteBalanceSat, this.reservedBalance)
        }
    }

    async getChannels() {
        const listChannelsResponse: lnrpc.ListChannelsResponse = await lnd.listChannels({})
        this.actionUpdateChannels(listChannelsResponse)
    }

    async getClosedChannels() {
        const closedChannelsResponse: lnrpc.ClosedChannelsResponse = await lnd.closedChannels({})
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

    async getLspInfo() {
        const lspId = await breezSdk.lspId()
        const { name, channelFeePermyriad, channelMinimumFeeMsat, minHtlcMsat, pubkey, host } = await breezSdk.fetchLspInfo(lspId)
        
        log.debug(`SAT044: LSP min htlc ${minHtlcMsat}, address: ${pubkey}@${host}`, true)
        this.actionUpdateLspInfo(name, channelFeePermyriad, toSatoshi(channelMinimumFeeMsat).toNumber())
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

    reset() {
        this.actionResetChannels()
    }

    subscribeChannelAcceptor() {
        this.cancelChannelAcceptor()

        this.channelAcceptor = lnd.channelAcceptor((data: lnrpc.ChannelAcceptRequest) => this.onChannelAcceptRequest(data))

        this.channelAcceptor.finally(() => {
            log.debug(`SAT035: Channel Acceptor shutdown`, true)
            this.channelAcceptor = null
        })
    }

    subscribeChannelEvents() {
        if (!this.subscribedChannelEvents) {
            lnd.subscribeChannelEvents((data: lnrpc.ChannelEventUpdate) => this.actionChannelEventReceived(data))
            this.subscribedChannelEvents = true
        }
    }

    async updateChannels() {
        await this.getChannelBalance()

        if (this.stores.lightningStore.backend === LightningBackend.LND) {
            await this.getChannels()
            await this.getClosedChannels()
        }
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

        if (type === lnrpc.ChannelEventUpdate.UpdateType.OPEN_CHANNEL && openChannel) {
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
        } else if (type === lnrpc.ChannelEventUpdate.UpdateType.ACTIVE_CHANNEL && activeChannel) {
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
        } else if (type === lnrpc.ChannelEventUpdate.UpdateType.INACTIVE_CHANNEL && inactiveChannel) {
            if (isValue(inactiveChannel.fundingTxidStr) && isValue(inactiveChannel.outputIndex)) {
                this.actionUpdateChannelByChannelPoint({
                    fundingTxid: inactiveChannel.fundingTxidStr!,
                    outputIndex: inactiveChannel.outputIndex!,
                    isActive: false
                })
            }
        } else if (type === lnrpc.ChannelEventUpdate.UpdateType.CLOSED_CHANNEL && closedChannel) {
            if (isValue(closedChannel.channelPoint)) {
                this.actionUpdateChannelByChannelPoint({
                    channelPoint: closedChannel.channelPoint!,
                    isClosed: true
                })
            }

            this.updateChannels()
        } else if (type === lnrpc.ChannelEventUpdate.UpdateType.FULLY_RESOLVED_CHANNEL && fullyResolvedChannel) {
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

    actionResetChannels() {
        this.lspName = "Satimoto LSP"
        this.lspFeePpmyraid = 0
        this.lspFeeMinimum = 0
        this.localBalance = 0
        this.remoteBalance = 0
        this.reservedBalance = 0
        this.channels.clear()
        this.channelRequests.clear()
        this.subscribedChannelEvents = false
    }

    actionSetReady() {
        this.ready = true
    }

    actionUpdateLspInfo(lspName: string, lspFeePpmyraid: number, lspFeeMinimum: number) {
        this.lspName = lspName
        this.lspFeePpmyraid = lspFeePpmyraid
        this.lspFeeMinimum = lspFeeMinimum
    }

    actionUpdateChannelRequestStatus(status: ChannelRequestStatus) {
        this.channelRequestStatus = status
    }

    actionUpdateChannelBalance(localBalance: number, remoteBalance: number, reserveBalance: number) {
        this.localBalance = localBalance
        this.remoteBalance = remoteBalance
        this.reservedBalance = reserveBalance
        log.debug(`SAT039: Channel Balance: ${this.localBalance}, ${this.remoteBalance}, ${this.reservedBalance}`, true)
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

    reactionBlockHeight() {
        if (this.stores.lightningStore.backend === LightningBackend.BREEZ_SDK) {
            this.lastActiveTimestamp = new Date().getTime()
        }
    }

    async whenSyncedToChain() {
        if (this.stores.lightningStore.backend === LightningBackend.BREEZ_SDK) {
            this.getLspInfo()
            this.updateChannels()
        } else if (this.stores.lightningStore.backend === LightningBackend.LND) {
            this.subscribeChannelEvents()
            this.updateChannels()
        }
    }
}
