import { EMAIL_REGEX, LN_BECH32_PREFIX } from "utils/constants"

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
