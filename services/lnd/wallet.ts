import { lnrpc } from "proto/proto"
import { NativeModules } from "react-native"
import { sendCommand, deserializeResponse } from "services/lnd/mobile"
import { toBytesOrNull, toLong } from "utils/conversion"
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

export interface SendCoinsProps {
    addr: string
    amount?: number
    targetConf?: number
    satPerVByte?: number
    minConfs?: number
}

export const sendCoins = async ({ addr, amount, targetConf, satPerVByte, minConfs }: SendCoinsProps): Promise<lnrpc.SendCoinsResponse> => {
    return sendCommand<lnrpc.ISendCoinsRequest, lnrpc.SendCoinsRequest, lnrpc.SendCoinsResponse>({
        request: lnrpc.SendCoinsRequest,
        response: lnrpc.SendCoinsResponse,
        method: service + "SendCoins",
        options: {
            addr,
            amount: amount ? toLong(amount) : null,
            sendAll: amount ? false : true,
            targetConf,
            satPerVbyte: satPerVByte ? toLong(satPerVByte) : null,
            minConfs
        }
    })
}

export const unlockWallet = async (password: string): Promise<lnrpc.UnlockWalletResponse> => {
    const requestTime = log.debugTime("SAT032: UnlockWallet Request")
    const base64Response = await LndMobile.unlockWallet(password)
    const data = deserializeResponse(lnrpc.UnlockWalletResponse, base64Response)

    log.debugTime("SAT032: UnlockWallet Response", requestTime, true)
    log.debug(JSON.stringify(data, null, 2))

    return data
}

export const walletBalance = async (): Promise<lnrpc.WalletBalanceResponse> => {
    return sendCommand<lnrpc.IWalletBalanceRequest, lnrpc.WalletBalanceRequest, lnrpc.WalletBalanceResponse>({
        request: lnrpc.WalletBalanceRequest,
        response: lnrpc.WalletBalanceResponse,
        method: service + "WalletBalance",
        options: {}
    })
}
