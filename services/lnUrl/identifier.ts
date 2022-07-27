import { LNURLPayParams } from "js-lnurl"

export const identifier = async (address: string): Promise<LNURLPayParams> => {
    if (address.includes("@")) {
        const [username, domain] = address.split("@")
        const protocol = domain.includes(".onion") ? "http" : "https"
        // TODO: handle Tor requests

        try {
            const fetchResult = await fetch(`${protocol}://${domain}/.well-known/lnurlp/${username}`)
            const payParams: LNURLPayParams = await fetchResult.json()

            if (payParams.callback) {
                payParams.decodedMetadata = JSON.parse(payParams.metadata)
                payParams.domain = domain

                return payParams
            }
        } catch {}
    }

    throw Error(`Unable to resolve ${address}`)
}
