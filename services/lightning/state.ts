import { lnrpc } from "proto/proto"
import { sendCommand, sendStreamCommand } from "services/LndMobileService"
import { store } from "stores/Store"
import { Log } from "utils/logging"

const log = new Log("State")

export const getState = async (): Promise<lnrpc.GetStateResponse> => {
    const response = await sendCommand<lnrpc.IGetStateRequest, lnrpc.GetStateRequest, lnrpc.GetStateResponse>({
        request: lnrpc.GetStateRequest,
        response: lnrpc.GetStateResponse,
        method: "GetState",
        options: {}
    })
    return response
}

export const subscribeState = async (): Promise<lnrpc.SubscribeStateResponse> => {
    const stream = sendStreamCommand<lnrpc.ISubscribeStateRequest, lnrpc.SubscribeStateRequest, lnrpc.SubscribeStateResponse>({
        request: lnrpc.SubscribeStateRequest,
        response: lnrpc.SubscribeStateResponse,
        method: "SubscribeState",
        options: {}
    })
    const response = await new Promise<lnrpc.SubscribeStateResponse>((resolve, reject) => {
        stream.on("data", (data) => store.lightningStore.updateState(data))
        stream.on("end", resolve)
        stream.on("error", reject)
        stream.on("status", (status) => log.info(`SubscribeState: ${status}`))
    })
    return response
}
