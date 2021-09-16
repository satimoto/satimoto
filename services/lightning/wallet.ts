import { NativeModules } from "react-native"
import { lnrpc } from "proto/proto"
import { sendCommand, deserializeResponse } from "services/LndMobileService"
import { toBuffer } from "utils/conversion"
import { Log } from "utils/logging"

const log = new Log("Wallet")
const { LndMobile } = NativeModules

export const genSeed = async (aezeedPassphrase: String, seedEntropy: String): Promise<lnrpc.GenSeedResponse> => {
    const response = await sendCommand<lnrpc.IGenSeedRequest, lnrpc.GenSeedRequest, lnrpc.GenSeedResponse>({
        request: lnrpc.GenSeedRequest,
        response: lnrpc.GenSeedResponse,
        method: "GenSeed",
        options: {
            aezeedPassphrase: toBuffer(aezeedPassphrase),
            seedEntropy: toBuffer(seedEntropy)
        }
    })
    return response
}

export const initWallet = async (seed: string[], password: string, recoveryWindow: number = 0): Promise<lnrpc.InitWalletResponse> => {
    const requestTime = log.debugTime("InitWallet Request")
    const base64Response = await LndMobile.initWallet(seed, password, recoveryWindow)
    const data = deserializeResponse(lnrpc.InitWalletResponse, base64Response)
    log.debugTime("InitWallet Response", requestTime)
    log.debug(JSON.stringify(data, null, 2))
    return data
}

export const unlockWallet = async (password: string): Promise<lnrpc.UnlockWalletResponse> => {
    const requestTime = log.debugTime("UnlockWallet Request")
    const base64Response = await LndMobile.unlockWallet(password)
    const data = deserializeResponse(lnrpc.UnlockWalletResponse, base64Response)
    log.debugTime("UnlockWallet Response", requestTime)
    log.debug(JSON.stringify(data, null, 2))
    return data
}
