import { Buffer } from "buffer"
import { base64ToBytes as b64ToBytes, bytesToBase64 as bytesToB64 } from "byte-base64"
import sha256 from "fast-sha256"
import Long from "long"
import { lnrpc } from "proto/proto"
import { TransactionStatus } from "types/transaction"
import { BytesLikeType, LongLikeType, SomeType } from "utils/types"

export const hexToBytes = (data: BytesLikeType): Uint8Array => {
    return typeof data == "string" ? Uint8Array.from(Buffer.from(data, "hex")) : data
}

export const bytesToHex = (data: BytesLikeType): string => {
    return data instanceof Uint8Array ? Buffer.from(data).toString("hex") : data
}

export const base64ToBytes = (data: BytesLikeType): Uint8Array => {
    return typeof data == "string" ? b64ToBytes(data) : data
}

export const bytesToBase64 = (data: BytesLikeType): string => {
    return data instanceof Uint8Array ? bytesToB64(data) : data
}

export const errorToString = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message
    }

    return String(error)
}

export const nanosecondsToMilliseconds = (nanoseconds: LongLikeType): number => {
    return toLong(nanoseconds).divide(1000).toNumber()
}

export const secondsToMilliseconds = (seconds: LongLikeType): number => {
    return toLong(seconds).multiply(1000).toNumber()
}

export const nanosecondsToDate = (nanoseconds: LongLikeType): Date => {
    return new Date(nanosecondsToMilliseconds(nanoseconds))
}

export const secondsToDate = (seconds: LongLikeType): Date => {
    return new Date(secondsToMilliseconds(seconds))
}

export const reverseByteOrder = (data: BytesLikeType): Uint8Array | string => {
    return data instanceof Uint8Array ? data.reverse() : (data.match(/.{2}/g) || []).reverse().join("")
}

export const toBytes = (str: SomeType) => {
    return Buffer.from(String(str), "utf8")
}

export const toBytesOrNull = (str?: SomeType | null) => {
    return str ? toBytes(str) : null
}

export const toHash = (data: BytesLikeType): Uint8Array => {
    return sha256(toBytes(data))
}

export const toHashOrNull = (data?: BytesLikeType | null): Uint8Array | null => {
    return data ? sha256(toBytes(data)) : null
}

export const toLong = (value: LongLikeType): Long => {
    return Long.fromValue(value)
}

export const toMilliSatoshi = (value: LongLikeType): Long => {
    return toLong(value).multiply(1000)
}
export const toSatoshi = (value: LongLikeType): Long => {
    return toLong(value).divide(1000)
}

export const toNumber = (value?: Long | null): number | undefined => {
    return value && typeof value != "undefined" ? Long.fromValue(value).toNumber() : undefined
}

export const toString = (data: BytesLikeType): string => {
    return data instanceof Uint8Array ? Buffer.from(data).toString("utf8") : data
}

export const toStringOrNull = (data?: BytesLikeType | null): string | null => {
    return data ? toString(data) : null
}

export const toTransactionStatus = (status: lnrpc.Payment.PaymentStatus | lnrpc.Invoice.InvoiceState): TransactionStatus => {
    const paymentStatus = status as lnrpc.Payment.PaymentStatus
    const invoiceState = status as lnrpc.Invoice.InvoiceState

    if (paymentStatus) {
        switch (paymentStatus) {
            case lnrpc.Payment.PaymentStatus.FAILED:
                return TransactionStatus.FAILED
            case lnrpc.Payment.PaymentStatus.IN_FLIGHT:
                return TransactionStatus.IN_PROGRESS
            case lnrpc.Payment.PaymentStatus.SUCCEEDED:
                return TransactionStatus.SUCCEEDED
        }
    } else if (invoiceState) {
        switch (invoiceState) {
            case lnrpc.Invoice.InvoiceState.CANCELED:
                return TransactionStatus.FAILED
            case lnrpc.Invoice.InvoiceState.SETTLED:
                return TransactionStatus.SUCCEEDED
            default:
                return TransactionStatus.IN_PROGRESS
        }
    }

    return TransactionStatus.UNKNOWN
}
