import { lnrpc } from "proto/proto"
import { sendStreamCommand, processStreamResponse } from "services/LndMobileService"
import { hexToBytes, toLong } from "utils/conversion"
import { Log } from "utils/logging"
import { BytesLikeType, LongLikeType } from "utils/types"

const log = new Log("Channel")

export type OpenStatusUpdateStreamResponse = (data: lnrpc.OpenStatusUpdate) => void

export const openChannel = (
    onData: OpenStatusUpdateStreamResponse,
    pubkey: BytesLikeType,
    amount: LongLikeType,
    privateChannel: boolean = false
): Promise<lnrpc.OpenStatusUpdate> => {
    const method = "OpenChannel"
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
