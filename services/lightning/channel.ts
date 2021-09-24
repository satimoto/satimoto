import Long from "long"
import { lnrpc } from "proto/proto"
import { sendStreamCommand, processStreamResponse } from "services/LndMobileService"
import { Log } from "utils/logging"

const log = new Log("Channel")

export type OpenStatusUpdateStreamResponse = (data: lnrpc.OpenStatusUpdate) => void

export const openChannel = (
    onData: OpenStatusUpdateStreamResponse,
    pubkey: string,
    amount: Long,
    privateChannel: boolean = false
): Promise<lnrpc.OpenStatusUpdate> => {
    const method = "OpenChannel"
    const stream = sendStreamCommand<lnrpc.IOpenChannelRequest, lnrpc.OpenChannelRequest, lnrpc.OpenStatusUpdate>({
        request: lnrpc.OpenChannelRequest,
        response: lnrpc.OpenStatusUpdate,
        method,
        options: {
            nodePubkeyString: pubkey,
            localFundingAmount: amount,
            private: privateChannel
        }
    })
    return processStreamResponse<lnrpc.OpenStatusUpdate>({ stream, method, onData })
}
