import InvoiceModel from "models/Invoice"
import moment from "moment"
import { lnrpc } from "proto/proto"
import * as breezSdk from "@breeztech/react-native-breez-sdk"
import { bytesToHex, secondsToDate, secondsToMilliseconds, toNumber, toSatoshi } from "utils/conversion"

export enum InvoiceStatus {
    OPEN = "OPEN",
    SETTLED = "SETTLED",
    CANCELLED = "CANCELLED",
    EXPIRED = "EXPIRED",
    ACCEPTED = "ACCEPTED"
}

const fromBreezInvoice = (invoice: breezSdk.LnInvoice): InvoiceModel => {
    const createdAt = new Date(secondsToMilliseconds(invoice.timestamp))

    return {
        createdAt: createdAt.toISOString(),
        expiresAt: moment(createdAt).add(toNumber(invoice.expiry), "second").toISOString(),
        description: invoice.description,
        hash: invoice.paymentHash,
        preimage: invoice.paymentSecret && bytesToHex(invoice.paymentSecret),
        paymentRequest: invoice.bolt11,
        status: InvoiceStatus.ACCEPTED,
        valueMsat: invoice.amountMsat?.toString(),
        valueSat: invoice.amountMsat && toSatoshi(invoice.amountMsat).toString()
    } as InvoiceModel
}

const fromBreezPayment = (payment: breezSdk.Payment, details: breezSdk.LnPaymentDetails): InvoiceModel => {
    const createdAt = new Date(secondsToMilliseconds(payment.paymentTime))

    return {
        createdAt: createdAt.toISOString(),
        expiresAt: createdAt.toISOString(),
        description: details.label,
        hash: details.paymentHash,
        preimage: details.paymentPreimage,
        paymentRequest: details.bolt11,
        status: InvoiceStatus.SETTLED,
        valueMsat: payment.amountMsat.toString(),
        valueSat: toSatoshi(payment.amountMsat).toString()
    }
}

const fromLndInvoice = (invoice: lnrpc.Invoice): InvoiceModel => {
    const createdAt = secondsToDate(invoice.creationDate)

    return {
        createdAt: createdAt.toISOString(),
        expiresAt: moment(createdAt).add(toNumber(invoice.expiry), "second").toISOString(),
        description: invoice.memo,
        hash: bytesToHex(invoice.rHash),
        preimage: bytesToHex(invoice.rPreimage),
        paymentRequest: invoice.paymentRequest,
        status: toInvoiceStatus(invoice.state),
        valueMsat: invoice.valueMsat.toString(),
        valueSat: invoice.value.toString()
    } as InvoiceModel
}

const fromLndInvoiceResponse = (invoice: lnrpc.AddInvoiceResponse, paymentRequest: breezSdk.LnInvoice): InvoiceModel => {
    const createdAt = new Date().toISOString()

    return {
        createdAt: createdAt,
        expiresAt: moment(createdAt).add(toNumber(paymentRequest.expiry), "second").toISOString(),
        description: paymentRequest.description,
        hash: bytesToHex(invoice.rHash),
        paymentRequest: invoice.paymentRequest,
        status: InvoiceStatus.OPEN,
        valueMsat: paymentRequest.amountMsat?.toString(),
        valueSat: paymentRequest.amountMsat && toSatoshi(paymentRequest.amountMsat).toString()
    } as InvoiceModel
}

const toInvoiceStatus = (state: lnrpc.Invoice.InvoiceState): InvoiceStatus => {
    switch (state) {
        case lnrpc.Invoice.InvoiceState.ACCEPTED:
            return InvoiceStatus.ACCEPTED
        case lnrpc.Invoice.InvoiceState.CANCELED:
            return InvoiceStatus.CANCELLED
        case lnrpc.Invoice.InvoiceState.SETTLED:
            return InvoiceStatus.SETTLED
    }

    return InvoiceStatus.OPEN
}

export { fromBreezInvoice, fromBreezPayment, fromLndInvoice, fromLndInvoiceResponse, toInvoiceStatus }
