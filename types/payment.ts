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

export { toPayReq, toPaymentStatus }
