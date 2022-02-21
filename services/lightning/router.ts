import { lnrpc, routerrpc } from "proto/proto"
import { sendStreamCommand, processStreamResponse } from "services/LndMobileService"
import { PAYMENT_CLTV_LIMIT, PAYMENT_TIMEOUT_SECONDS, PAYMENT_FEE_LIMIT_SAT } from "utils/constants"
import { hexToBytes, toHash, toLong } from "utils/conversion"
import { Log } from "utils/logging"
import { BytesLikeType, LongLikeType } from "utils/types"

const log = new Log("Router")
const service = "Router"

export type PaymentStreamResponse = (data: lnrpc.Payment) => void

export const sendPaymentV2 = (
    onData: PaymentStreamResponse,
    paymentRequest?: string,
    dest?: BytesLikeType,
    amt?: LongLikeType,
    preImage?: BytesLikeType,
    timeoutSeconds: number = PAYMENT_TIMEOUT_SECONDS,
    feeLimitSat: LongLikeType = PAYMENT_FEE_LIMIT_SAT,
    cltvLimit: number = PAYMENT_CLTV_LIMIT
): Promise<lnrpc.Payment> => {
    const method = service + "SendPaymentV2"
    const stream = sendStreamCommand<routerrpc.ISendPaymentRequest, routerrpc.SendPaymentRequest, lnrpc.Payment>({
        request: routerrpc.SendPaymentRequest,
        response: lnrpc.Payment,
        method,
        options: {
            dest: hexToBytes(dest),
            amt: toLong(amt),
            paymentHash: toHash(preImage),
            paymentRequest,
            timeoutSeconds,
            feeLimitSat: toLong(feeLimitSat),
            cltvLimit
        }
    })
    return processStreamResponse<lnrpc.Payment>({stream, method, onData})
}
