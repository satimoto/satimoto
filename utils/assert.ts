import { validate } from "bitcoin-address-validation"
import { toNetwork } from "types/network"
import { NETWORK } from "utils/build"
import { EMAIL_REGEX, LN_BECH32_PREFIX } from "utils/constants"

export const assertAddress = (address: string) => {
    if (!address || address.length === 0 || !validate(address, toNetwork(NETWORK))) {
        throw Error("Invalid Bitcoin address")
    }
}

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
