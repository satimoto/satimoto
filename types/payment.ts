import PaymentModel from "models/Payment"
import moment from "moment"
import { lnrpc } from "proto/proto"
import * as breezSdk from "@breeztech/react-native-breez-sdk"
import { nanosecondsToDate, secondsToMilliseconds, toNumber, toSatoshi } from "utils/conversion"

export enum PaymentStatus {
    UNKNOWN = "UNKNOWN",
    IN_PROGRESS = "IN_PROGRESS",
    SUCCEEDED = "SUCCEEDED",
    FAILED = "FAILED",
    EXPIRED = "EXPIRED"
}

const fromBreezPayment = (payment: breezSdk.Payment): PaymentModel => {
    const paymentDetails = payment.details as breezSdk.LnPaymentDetails
    const createdAt = new Date(secondsToMilliseconds(payment.paymentTime))

    return {
        createdAt: createdAt.toISOString(),
        expiresAt: createdAt.toISOString(),
        description: payment.description,
        hash: paymentDetails.paymentHash,
        preimage: paymentDetails.paymentPreimage,
        status: payment.pending ? PaymentStatus.IN_PROGRESS : PaymentStatus.SUCCEEDED,
        valueMsat: payment.amountMsat.toString(),
        valueSat: toSatoshi(payment.amountMsat).toString(),
        feeMsat: payment.feeMsat.toString(),
        feeSat: toSatoshi(payment.feeMsat).toString()
    } as PaymentModel
}

const fromLndPayment = (payment: lnrpc.Payment, paymentRequest: breezSdk.LnInvoice): PaymentModel => {
    const createdAt = nanosecondsToDate(payment.creationTimeNs)

    return {
        createdAt: createdAt.toISOString(),
        expiresAt: moment(createdAt).add(toNumber(paymentRequest.expiry), "second").toISOString(),
        description: paymentRequest.description,
        hash: payment.paymentHash,
        preimage: payment.paymentPreimage,
        status: toPaymentStatus(payment.status),
        failureReasonKey: paymentFailureToLocaleKey(payment.failureReason),
        valueMsat: payment.valueMsat.toString(),
        valueSat: payment.valueSat.toString(),
        feeMsat: payment.feeMsat.toString(),
        feeSat: payment.feeSat.toString()
    } as PaymentModel
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

export { fromBreezPayment, fromLndPayment, paymentFailureToLocaleKey, toPaymentStatus }
