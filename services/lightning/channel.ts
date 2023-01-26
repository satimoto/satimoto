import { lnrpc } from "proto/proto"
import { bidirectionalStreamRequest, sendCommand, sendStreamCommand, sendStreamResponse } from "services/LndMobileService"
import { Sendable } from "utils/sendable"
import { hexToBytes, toLong } from "utils/conversion"
import { Log } from "utils/logging"
import { BytesLikeType, LongLikeType } from "utils/types"

const log = new Log("Channel")
const service = ""

export type ChannelAcceptor = Sendable<lnrpc.IChannelAcceptResponse, lnrpc.ChannelAcceptRequest>
export type ChannelAcceptorStreamRequest = (data: lnrpc.ChannelAcceptRequest) => void

export type ChannelEventUpdateStreamResponse = (data: lnrpc.ChannelEventUpdate) => void
export type OpenStatusUpdateStreamResponse = (data: lnrpc.OpenStatusUpdate) => void

export const channelAcceptor = (onData: ChannelAcceptorStreamRequest): ChannelAcceptor => {
    const request = lnrpc.ChannelAcceptResponse
    const method = service + "ChannelAcceptor"
    const stream = sendStreamCommand<lnrpc.IChannelAcceptResponse, lnrpc.ChannelAcceptResponse, lnrpc.ChannelAcceptRequest>({
        request,
        response: lnrpc.ChannelAcceptRequest,
        method,
        options: {}
    })
    return bidirectionalStreamRequest<lnrpc.IChannelAcceptResponse, lnrpc.ChannelAcceptResponse, lnrpc.ChannelAcceptRequest>(
        request,
        stream,
        sendStreamResponse<lnrpc.ChannelAcceptRequest>({ stream, method, onData })
    )
}

export const channelBalance = (): Promise<lnrpc.ChannelBalanceResponse> => {
    return sendCommand<lnrpc.IChannelBalanceRequest, lnrpc.ChannelBalanceRequest, lnrpc.ChannelBalanceResponse>({
        request: lnrpc.ChannelBalanceRequest,
        response: lnrpc.ChannelBalanceResponse,
        method: service + "ChannelBalance",
        options: {}
    })
}

export type CloseStatusUpdateStreamResponse = (data: lnrpc.CloseStatusUpdate) => void

export interface CloseChannelProps {
    channelPoint: lnrpc.IChannelPoint
    force?: boolean
    targetConf?: number
    deliveryAddress?: string
    satPerVByte?: number
    maxFeePerVbyte?: number
}

export const closeChannel = (
    onData: CloseStatusUpdateStreamResponse,
    {
        channelPoint,
        force = false,
        targetConf,
        deliveryAddress,
        satPerVByte,
        maxFeePerVbyte
    }: CloseChannelProps
): Promise<lnrpc.CloseStatusUpdate> => {
    const method = service + "CloseChannel"
    const stream = sendStreamCommand<lnrpc.ICloseChannelRequest, lnrpc.CloseChannelRequest, lnrpc.CloseStatusUpdate>({
        request: lnrpc.CloseChannelRequest,
        response: lnrpc.CloseStatusUpdate,
        method,
        options: {
            channelPoint,
            force,
            targetConf,
            deliveryAddress,
            satPerVbyte: satPerVByte ? toLong(satPerVByte) : null,
            maxFeePerVbyte: maxFeePerVbyte ? toLong(maxFeePerVbyte) : null
        }
    })
    return sendStreamResponse<lnrpc.CloseStatusUpdate>({ stream, method, onData })
}

interface ListChannelsProps {
    activeOnly?: boolean
    inactiveOnly?: boolean
    publicOnly?: boolean
    privateOnly?: boolean
    peer?: BytesLikeType
}

export const listChannels = ({
    activeOnly = false,
    inactiveOnly = false,
    publicOnly = false,
    privateOnly = false,
    peer
}: ListChannelsProps): Promise<lnrpc.ListChannelsResponse> => {
    return sendCommand<lnrpc.IListChannelsRequest, lnrpc.ListChannelsRequest, lnrpc.ListChannelsResponse>({
        request: lnrpc.ListChannelsRequest,
        response: lnrpc.ListChannelsResponse,
        method: service + "ListChannels",
        options: {
            activeOnly,
            inactiveOnly,
            publicOnly,
            privateOnly,
            peer: peer ? hexToBytes(peer) : null
        }
    })
}

interface ClosedChannelsProps {
    cooperative?: boolean
    localForce?: boolean
    remoteForce?: boolean
    breach?: boolean
    fundingCanceled?: boolean
    abandoned?: boolean
}

export const closedChannels = ({
    cooperative,
    localForce,
    remoteForce,
    breach,
    fundingCanceled,
    abandoned
}: ClosedChannelsProps): Promise<lnrpc.ClosedChannelsResponse> => {
    return sendCommand<lnrpc.IClosedChannelsRequest, lnrpc.ClosedChannelsRequest, lnrpc.ClosedChannelsResponse>({
        request: lnrpc.ClosedChannelsRequest,
        response: lnrpc.ClosedChannelsResponse,
        method: service + "ClosedChannels",
        options: {
            cooperative,
            localForce,
            remoteForce,
            breach,
            fundingCanceled,
            abandoned
        }
    })
}

export const openChannel = (
    onData: OpenStatusUpdateStreamResponse,
    pubkey: BytesLikeType,
    amount: LongLikeType,
    privateChannel: boolean = false
): Promise<lnrpc.OpenStatusUpdate> => {
    const method = service + "OpenChannel"
    const stream = sendStreamCommand<lnrpc.IOpenChannelRequest, lnrpc.OpenChannelRequest, lnrpc.OpenStatusUpdate>({
        request: lnrpc.OpenChannelRequest,
        response: lnrpc.OpenStatusUpdate,
        method,
        options: {
            nodePubkey: hexToBytes(pubkey),
            localFundingAmount: toLong(amount),
            private: privateChannel
        }
    })
    return sendStreamResponse<lnrpc.OpenStatusUpdate>({ stream, method, onData })
}

export const subscribeChannelEvents = (onData: ChannelEventUpdateStreamResponse): Promise<lnrpc.ChannelEventUpdate> => {
    const method = service + "SubscribeChannelEvents"
    const stream = sendStreamCommand<lnrpc.IChannelEventSubscription, lnrpc.ChannelEventSubscription, lnrpc.ChannelEventUpdate>({
        request: lnrpc.ChannelEventSubscription,
        response: lnrpc.ChannelEventUpdate,
        method,
        options: {}
    })
    return sendStreamResponse<lnrpc.ChannelEventUpdate>({ stream, method, onData })
}
