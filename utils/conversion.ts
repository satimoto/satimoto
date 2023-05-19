import { Buffer } from "buffer"
import { base64ToBytes as b64ToBytes, bytesToBase64 as bytesToB64 } from "byte-base64"
import sha256 from "fast-sha256"
import Long from "long"
import { BytesLikeType, LongLikeType, SomeType } from "utils/types"

export const deepCopy = (data: any): any => {
    return JSON.parse(JSON.stringify(data))
}

export const hexToBytes = (data: BytesLikeType): Uint8Array => {
    return typeof data === "string" ? Uint8Array.from(Buffer.from(data, "hex")) : data instanceof Uint8Array ? data : Uint8Array.from(data)
}

export const bytesToHex = (data: BytesLikeType): string => {
    return data instanceof Uint8Array || Array.isArray(data) ? Buffer.from(data).toString("hex") : data
}

export const base64ToBytes = (data: BytesLikeType): Uint8Array => {
    return typeof data === "string" ? b64ToBytes(data) : data instanceof Uint8Array ? data : Uint8Array.from(data)
}

export const bytesToBase64 = (data: BytesLikeType): string => {
    return data instanceof Uint8Array || Array.isArray(data) ? bytesToB64(data) : data
}

export const errorToString = (error: unknown, action: string = "[\\w]+"): string => {
    const re = new RegExp(`Breez SDK error: (?:${action}: )?`)

    if (error instanceof Error) {
        return error.message.replace(re, "")
    }

    return String(error).replace(re, "")
}

export const nanosecondsToMilliseconds = (nanoseconds: LongLikeType): number => {
    return toLong(nanoseconds).divide(1000000).toNumber()
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

export const reverseByteOrder = (data: BytesLikeType): Uint8Array | number[] | string => {
    return data instanceof Uint8Array ? data.reverse() : Array.isArray(data) ? data.reverse() : (data.match(/.{2}/g) || []).reverse().join("")
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

export const toLong = (value: LongLikeType | Uint8Array): Long => {
    return value instanceof Uint8Array ? Long.fromBytes(toNumberArray(value)) : Array.isArray(value) ? Long.fromBytes(value) : Long.fromValue(value)
}

export const toMilliSatoshi = (value: LongLikeType): Long => {
    return toLong(value).multiply(1000)
}
export const toSatoshi = (value: LongLikeType): Long => {
    return toLong(value).divide(1000)
}

export const toNumber = (value: LongLikeType): number => {
    return Long.fromValue(value).toNumber()
}

export const toNumberArray = (arr: Uint8Array): number[] => {
    let numberArr: number[] = []

    for (let i = 0; i < arr.length; i++) {
        numberArr = numberArr.concat(arr[i])
    }

    return numberArr
}

export const toString = (data: BytesLikeType): string => {
    return data instanceof Uint8Array || Array.isArray(data) ? Buffer.from(data).toString("utf8") : data
}

export const toStringOrNull = (data?: BytesLikeType | null): string | null => {
    return data ? toString(data) : null
}
