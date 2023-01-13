import { lnrpc } from "proto/proto"
import { bytesToHex } from "utils/conversion"

interface PayReq {
    destination: string
    paymentHash: string
    numSatoshis: Long
    timestamp: Long
    expiry: Long
    description: string
    descriptionHash: string
    fallbackAddr: string
    cltvExpiry: Long
    paymentAddr: string
    numMsat: Long
}

export type { PayReq }

const toPayReq = (payReq: lnrpc.PayReq): PayReq => {
    return {
        destination: payReq.destination,
        paymentHash: payReq.paymentHash,
        numSatoshis: payReq.numSatoshis,
        timestamp: payReq.timestamp,
        expiry: payReq.expiry,
        description: payReq.description,
        descriptionHash: payReq.descriptionHash,
        fallbackAddr: payReq.fallbackAddr,
        cltvExpiry: payReq.cltvExpiry,
        paymentAddr: bytesToHex(payReq.paymentAddr),
        numMsat: payReq.numMsat
    } as PayReq
}

export enum PaymentStatus {
    UNKNOWN = "UNKNOWN",
    IN_PROGRESS = "IN_PROGRESS",
    SUCCEEDED = "SUCCEEDED",
    FAILED = "FAILED",
    EXPIRED = "EXPIRED"
}

const toPaymentStatus = (state: lnrpc.Payment.PaymentStatus): PaymentStatus => {
    switch (state) {
        case lnrpc.Payment.PaymentStatus.IN_FLIGHT:
            return PaymentStatus.IN_PROGRESS
        case lnrpc.Payment.PaymentStatus.SUCCEEDED:
            return PaymentStatus.SUCCEEDED
        case lnrpc.Payment.PaymentStatus.FAILED:
            return PaymentStatus.FAILED
    }

    return PaymentStatus.UNKNOWN
}

const paymentFailureToLocaleKey = (reason: lnrpc.PaymentFailureReason): string | undefined => {
    switch (reason) {
        case lnrpc.PaymentFailureReason.FAILURE_REASON_ERROR:
            return "PaymentFailure_Error"
        case lnrpc.PaymentFailureReason.FAILURE_REASON_INCORRECT_PAYMENT_DETAILS:
            return "PaymentFailure_IncorrectPaymentDetails"
        case lnrpc.PaymentFailureReason.FAILURE_REASON_INSUFFICIENT_BALANCE:
            return "PaymentFailure_InsufficientBalance"
        case lnrpc.PaymentFailureReason.FAILURE_REASON_NO_ROUTE:
            return "PaymentFailure_NoRoute"
        case lnrpc.PaymentFailureReason.FAILURE_REASON_TIMEOUT:
            return "PaymentFailure_Timeout"
    }
}

export { paymentFailureToLocaleKey, toPayReq, toPaymentStatus }
