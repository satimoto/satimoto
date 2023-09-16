import { lnrpc } from "proto/proto"
import * as breezSdk from "@breeztech/react-native-breez-sdk"
import * as lnd from "services/lnd"
import { LightningBackend } from "types/lightningBackend"
import { BytesLikeType } from "utils/types"
import { startLogEvents } from "./log"
import { sendPayment } from "./sendPayment"

export const signMessage = async (backend: LightningBackend, msg: BytesLikeType): Promise<string> => {
    if (backend === LightningBackend.LND) {
        const response: lnrpc.SignMessageResponse = await lnd.signMessage(msg)
        return response.signature
    }

    throw Error("Not implemented")
}

export const parseInput = async (input: string): Promise<breezSdk.InputType> => {
    return breezSdk.parseInput(input)
}

export const parseInvoice = async (bolt11: string): Promise<breezSdk.LnInvoice> => {
    return breezSdk.parseInvoice(bolt11)
}

export const mnemonicToSeed = async (mnemonic: string): Promise<number[]> => {
    return breezSdk.mnemonicToSeed(mnemonic)
}

export { sendPayment, startLogEvents }
