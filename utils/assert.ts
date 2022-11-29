import { EMAIL_REGEX, LN_BECH32_PREFIX } from "utils/constants"

export const assertEmail = (address: string) => {
    if (!EMAIL_REGEX.test(address)) {
        throw Error("Invalid lightning address")
    }
}

export const assertNetwork = (bech32Address: string) => {
    if (bech32Address && !bech32Address.toLowerCase().startsWith(LN_BECH32_PREFIX)) {
        throw Error("Invalid lightning invoice")
    }
}
