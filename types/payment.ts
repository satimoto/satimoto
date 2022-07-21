import { lnrpc } from "proto/proto"

export enum PaymentStatus {
    UNKNOWN = "UNKNOWN",
    IN_PROGRESS = "IN_PROGRESS",
    SUCCEEDED = "SUCCEEDED",
    FAILED = "FAILED"
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

export { toPaymentStatus }
