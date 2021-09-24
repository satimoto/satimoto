import { base64ToBytes } from "byte-base64"
import sha256 from "fast-sha256"
import Long from "long"
import { BytesLikeType, LongLikeType } from "utils/types"

export const hexToBytes = (data?: BytesLikeType): Uint8Array | undefined => {
    return typeof data == "string" ? Uint8Array.from(Buffer.from(data, "hex")) : data
}

export const bytesToHex = (data?: BytesLikeType): string | undefined => {
    return data instanceof Uint8Array ? Buffer.from(data).toString("hex") : data
}

export const toBuffer = (str?: any) => {
    return str ? Buffer.from(String(str), "utf8") : str
}

export const toBytes = (data?: BytesLikeType): Uint8Array | undefined => {
    return typeof data == "string" ? base64ToBytes(data) : data
}

export const toHash = (data?: BytesLikeType): Uint8Array | undefined => {
    const bytes = toBytes(data)
    return typeof bytes != "undefined" ? sha256(bytes) : bytes
}

export const toLong = (value?: LongLikeType): Long | undefined => {
    return typeof value != "undefined" ? Long.fromValue(value) : value
}
