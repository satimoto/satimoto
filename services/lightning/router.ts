import { lnrpc, routerrpc } from "proto/proto"
import { sendCommand, sendStreamCommand, sendStreamResponse } from "services/LndMobileService"
import { PAYMENT_CLTV_LIMIT, PAYMENT_TIMEOUT_SECONDS, PAYMENT_FEE_LIMIT_SAT } from "utils/constants"
import { hexToBytes, toHashOrNull, toLong } from "utils/conversion"
import { Log } from "utils/logging"
import { BytesLikeType, LongLikeType } from "utils/types"

const log = new Log("Router")
const service = "Router"

export type PaymentStreamResponse = (data: lnrpc.Payment) => void

export interface SendPaymentV2Props {
    paymentRequest?: string
    dest?: BytesLikeType
    amt?: LongLikeType
    preImage?: BytesLikeType
    timeoutSeconds?: number
    feeLimitSat?: LongLikeType
    cltvLimit?: number
    amp?: boolean
}

export const resetMissionControl = (): Promise<routerrpc.ResetMissionControlResponse> => {
    return sendCommand<routerrpc.IResetMissionControlRequest, routerrpc.ResetMissionControlRequest, routerrpc.ResetMissionControlResponse>({
        request: routerrpc.ResetMissionControlRequest,
        response: routerrpc.ResetMissionControlResponse,
        method: service + "ResetMissionControl",
        options: {}
    })
}

export const sendPaymentV2 = (
    onData: PaymentStreamResponse,
    {
        paymentRequest,
        dest,
        amt,
        preImage,
        timeoutSeconds = PAYMENT_TIMEOUT_SECONDS,
        feeLimitSat = PAYMENT_FEE_LIMIT_SAT,
        cltvLimit = PAYMENT_CLTV_LIMIT,
        amp = false
    }: SendPaymentV2Props
): Promise<lnrpc.Payment> => {
    const method = service + "SendPaymentV2"
    const stream = sendStreamCommand<routerrpc.ISendPaymentRequest, routerrpc.SendPaymentRequest, lnrpc.Payment>({
        request: routerrpc.SendPaymentRequest,
        response: lnrpc.Payment,
        method,
        options: {
            dest: dest ? hexToBytes(dest) : null,
            amt: amt ? toLong(amt) : null,
            paymentHash: toHashOrNull(preImage),
            paymentRequest,
            timeoutSeconds,
            feeLimitSat: toLong(feeLimitSat),
            cltvLimit,
            amp
        }
    })
    return sendStreamResponse<lnrpc.Payment>({ stream, method, onData })
}
