import { LN_BECH32_PREFIX } from "utils/constants"

const EMAIL_REGEX: RegExp = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

export const assertEmail = (address: string) => {
    if (!EMAIL_REGEX.test(address)) {
        throw Error("Invalid email address")
    }
}

export const assertNetwork = (bech32Address: string) => {
    if (!bech32Address.startsWith(LN_BECH32_PREFIX)) {
        throw Error("Bech32 address mismatch")
    }
}
