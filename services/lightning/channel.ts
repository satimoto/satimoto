import { lnrpc } from "proto/proto"
import { sendCommand, sendStreamCommand, processStreamResponse } from "services/LndMobileService"
import { hexToBytes, toLong } from "utils/conversion"
import { Log } from "utils/logging"
import { BytesLikeType, LongLikeType } from "utils/types"

const log = new Log("Channel")
const service = ""

export type ChannelEventUpdateStreamResponse = (data: lnrpc.ChannelEventUpdate) => void
export type OpenStatusUpdateStreamResponse = (data: lnrpc.OpenStatusUpdate) => void

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
    return processStreamResponse<lnrpc.OpenStatusUpdate>({ stream, method, onData })
}

export const subscribeChannelEvents = (onData: ChannelEventUpdateStreamResponse): Promise<lnrpc.ChannelEventUpdate> => {
    const method = service + "SubscribeChannelEvents"
    const stream = sendStreamCommand<lnrpc.IChannelEventSubscription, lnrpc.ChannelEventSubscription, lnrpc.ChannelEventUpdate>({
        request: lnrpc.ChannelEventSubscription,
        response: lnrpc.ChannelEventUpdate,
        method,
        options: {}
    })
    return processStreamResponse<lnrpc.ChannelEventUpdate>({ stream, method, onData })
}
