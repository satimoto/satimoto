import { Network } from "bitcoin-address-validation"

const toNetwork = (network: string): Network => {
    switch (network) {
        case Network.regtest:
            return Network.regtest
        case Network.testnet:
            return Network.testnet
    }

    return Network.mainnet
}

export { toNetwork }
