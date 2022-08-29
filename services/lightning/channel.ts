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
