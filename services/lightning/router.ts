import { lnrpc, routerrpc } from "proto/proto"
import { sendStreamCommand } from "services/LndMobileService"
import { PAYMENT_CLTV_LIMIT, PAYMENT_TIMEOUT_SECONDS, PAYMENT_FEE_LIMIT_SAT } from "utils/constants"
import { hexToBytes, toHash, toLong } from "utils/conversion"
import { Log } from "utils/logging"
import { BytesLikeType, LongLikeType } from "utils/types"

const log = new Log("Router")

export type SendPaymentV2Type = (data: lnrpc.Payment) => void

export const sendPaymentV2 = async (
    onData: SendPaymentV2Type,
    paymentRequest?: string,
    dest?: BytesLikeType,
    amt?: LongLikeType,
    preImage?: BytesLikeType,
    timeoutSeconds: number = PAYMENT_TIMEOUT_SECONDS,
    feeLimitSat: LongLikeType = PAYMENT_FEE_LIMIT_SAT,
    cltvLimit: number = PAYMENT_CLTV_LIMIT
): Promise<lnrpc.Payment> => {
    const stream = sendStreamCommand<routerrpc.ISendPaymentRequest, routerrpc.SendPaymentRequest, lnrpc.Payment>({
        request: routerrpc.SendPaymentRequest,
        response: lnrpc.Payment,
        method: "SendPaymentV2",
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
    const response = await new Promise<lnrpc.Payment>((resolve, reject) => {
        stream.on("data", onData)
        stream.on("end", resolve)
        stream.on("error", reject)
        stream.on("status", (status) => log.info(`SendPaymentV2: ${status}`))
    })
    return response
}
