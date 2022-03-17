import { Hash, HMAC } from "fast-sha256"
import { LNURLAuthParams, LNURLResponse } from "js-lnurl"
import { lnrpc } from "proto/proto"
import { ecdsaSign, publicKeyCreate, signatureExport } from "secp256k1"
import { signMessage } from "services/LightningService"
import { bytesToHex, hexToBytes, toBytes } from "utils/conversion"
import { LNURL_CANONICAL_PHRASE } from "utils/constants"

/**
 * LNURL Auth
 * LUD-04: auth base spec https://github.com/fiatjaf/lnurl-rfc/blob/luds/04.md
 * LUD-13: signMessage-based seed generation for auth protocol https://github.com/fiatjaf/lnurl-rfc/blob/luds/13.md
 */
const authenticate = async (authParams: LNURLAuthParams): Promise<boolean> => {
    const signMessageResponse: lnrpc.SignMessageResponse = await signMessage(LNURL_CANONICAL_PHRASE)
    const hashingKey = new Hash().update(toBytes(signMessageResponse.signature)).digest()
    const linkingPrivKey = new HMAC(hashingKey).update(toBytes(authParams.domain)).digest()
    const linkingPubKey = publicKeyCreate(linkingPrivKey, true)
    const signedK1 = ecdsaSign(hexToBytes(authParams.k1), linkingPrivKey)
    const exportedK1 = signatureExport(signedK1.signature)

    const url = `${authParams.callback}&sig=${bytesToHex(exportedK1)}&key=${bytesToHex(linkingPubKey)}`

    try {
        const fetchResult = await fetch(url)
        const authResponse: LNURLResponse = await fetchResult.json()

        if (authResponse.status === "OK") {
            return true
        } else if (authResponse.reason) {
            throw new Error(authResponse.reason)
        }
    } catch (error) {}

    throw new Error(`Invalid response from ${authParams.domain}`)
}

export { authenticate }
