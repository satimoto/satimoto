import { lnrpc } from "proto/proto"
import { NativeModules } from "react-native"
import { sendCommand, deserializeResponse } from "services/LndMobileService"
import { toBytesOrNull } from "utils/conversion"
import { Log } from "utils/logging"

const log = new Log("Wallet")
const service = ""
const { LndMobile } = NativeModules

export const genSeed = (aezeedPassphrase?: string, seedEntropy?: string): Promise<lnrpc.GenSeedResponse> => {
    return sendCommand<lnrpc.IGenSeedRequest, lnrpc.GenSeedRequest, lnrpc.GenSeedResponse>({
        request: lnrpc.GenSeedRequest,
        response: lnrpc.GenSeedResponse,
        method: service + "GenSeed",
        options: {
            aezeedPassphrase: toBytesOrNull(aezeedPassphrase),
            seedEntropy: toBytesOrNull(seedEntropy)
        }
    })
}

export const initWallet = async (seed: string[], password: string, recoveryWindow: number = 0): Promise<lnrpc.InitWalletResponse> => {
    const requestTime = log.debugTime("SAT031: InitWallet Request")
    const base64Response = await LndMobile.initWallet(seed, password, recoveryWindow)
    const data = deserializeResponse(lnrpc.InitWalletResponse, base64Response)
    
    log.debugTime("SAT031: InitWallet Response", requestTime, true)
    log.debug(JSON.stringify(data, null, 2))

    return data
}

export const unlockWallet = async (password: string): Promise<lnrpc.UnlockWalletResponse> => {
    const requestTime = log.debugTime("SAT032: UnlockWallet Request")
    const base64Response = await LndMobile.unlockWallet(password)
    const data = deserializeResponse(lnrpc.UnlockWalletResponse, base64Response)

    log.debugTime("SAT032: UnlockWallet Response", requestTime, true)
    log.debug(JSON.stringify(data, null, 2))

    return data
}
