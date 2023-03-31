import { lnrpc } from "proto/proto"
import { sendCommand, sendStreamCommand, sendStreamResponse } from "services/lnd/mobile"
import { Log } from "utils/logging"

const log = new Log("State")
const service = ""

export type SubscribeStateStreamResponse = (data: lnrpc.SubscribeStateResponse) => void

export const getState = (): Promise<lnrpc.GetStateResponse> => {
    return sendCommand<lnrpc.IGetStateRequest, lnrpc.GetStateRequest, lnrpc.GetStateResponse>({
        request: lnrpc.GetStateRequest,
        response: lnrpc.GetStateResponse,
        method: service + "GetState",
        options: {}
    })
}

export const subscribeState = (onData: SubscribeStateStreamResponse): Promise<lnrpc.SubscribeStateResponse> => {
    const method = service + "SubscribeState"
    const stream = sendStreamCommand<lnrpc.ISubscribeStateRequest, lnrpc.SubscribeStateRequest, lnrpc.SubscribeStateResponse>({
        request: lnrpc.SubscribeStateRequest,
        response: lnrpc.SubscribeStateResponse,
        method,
        options: {}
    })
    return sendStreamResponse<lnrpc.SubscribeStateResponse>({ stream, method, onData })
}
