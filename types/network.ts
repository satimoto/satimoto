import { Network } from "bitcoin-address-validation"
import { Network as BreezNetwork } from "@breeztech/react-native-breez-sdk"

const toNetwork = (network: string): Network => {
    switch (network) {
        case Network.regtest:
            return Network.regtest
        case Network.testnet:
            return Network.testnet
    }

    return Network.mainnet
}

const toBreezNetwork = (network: string): BreezNetwork => {
    switch (network) {
        case Network.regtest:
            return BreezNetwork.REGTEST
        case Network.testnet:
            return BreezNetwork.TESTNET
        case "signet":
            return BreezNetwork.SIGNET
    }

    return BreezNetwork.BITCOIN
}

export { toBreezNetwork, toNetwork }
