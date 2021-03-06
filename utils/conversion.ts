import { Buffer } from "buffer"
import { base64ToBytes as b64ToBytes, bytesToBase64 as bytesToB64 } from "byte-base64"
import sha256 from "fast-sha256"
import Long from "long"
import { BytesLikeType, LongLikeType } from "utils/types"

export const hexToBytes = (data?: BytesLikeType): Uint8Array | undefined => {
    return typeof data == "string" ? Uint8Array.from(Buffer.from(data, "hex")) : data
}

export const bytesToHex = (data?: BytesLikeType): string | undefined => {
    return data instanceof Uint8Array ? Buffer.from(data).toString("hex") : data
}

export const base64ToBytes = (data: BytesLikeType): Uint8Array => {
    return typeof data == "string" ? b64ToBytes(data) : data
}

export const bytesToBase64 = (data: BytesLikeType): string => {
    return data instanceof Uint8Array ? bytesToB64(data) : data
}

export const reverseByteOrder = (data: BytesLikeType): Uint8Array | string => {
    return data instanceof Uint8Array ? data.reverse() : (data.match(/.{2}/g) || []).reverse().join("")
}

export const toBytes = (str?: any) => {
    return str ? Buffer.from(String(str), "utf8") : str
}

export const toHash = (data?: BytesLikeType): Uint8Array | undefined => {
    const bytes = toBytes(data)
    return typeof bytes != "undefined" ? sha256(bytes) : bytes
}

export const toLong = (value?: LongLikeType): Long | undefined => {
    return typeof value != "undefined" ? Long.fromValue(value) : value
}

export const toString = (data: BytesLikeType): string | undefined => {
    return data instanceof Uint8Array ? Buffer.from(data).toString("utf8") : data
}
