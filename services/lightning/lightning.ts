import { NativeModules } from "react-native"
import { lnrpc } from "proto/proto"
import { sendCommand } from "services/LndMobileService"
import { Log } from "utils/logging"

const log = new Log("Lightning")
const { LndMobile } = NativeModules

export const start = async (): Promise<void> => {
    const requestTime = log.debugTime("Start Request")
    await LndMobile.start()
    log.debugTime("Start Response", requestTime)
}

export const stop = async (): Promise<void> => {
    const requestTime = log.debugTime("Stop Request")
    await LndMobile.stop()
    log.debugTime("Stop Response", requestTime)
}

export const getInfo = async (): Promise<lnrpc.GetInfoResponse> => {
    const response = await sendCommand<lnrpc.IGetInfoRequest, lnrpc.GetInfoRequest, lnrpc.GetInfoResponse>({
        request: lnrpc.GetInfoRequest,
        response: lnrpc.GetInfoResponse,
        method: "GetInfo",
        options: {}
    })
    return response
}
