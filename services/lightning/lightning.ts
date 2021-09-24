import Long from "long"
import { NativeModules } from "react-native"
import { lnrpc } from "proto/proto"
import { sendCommand, sendStreamCommand } from "services/LndMobileService"
import { Log } from "utils/logging"

const log = new Log("Lightning")
const { LndMobile } = NativeModules

export type SubscribeInvoicesType = (data: lnrpc.Invoice) => void

export type SubscribeTransactionsType = (data: lnrpc.Transaction) => void

export const start = async (): Promise<string> => {
    const requestTime = log.debugTime("Start Request")
    try {
        const response = await LndMobile.start()
        log.debugTime("Start Response", requestTime)
        return response
    } catch (e) {
        log.errorTime("Start Error", requestTime)
        log.error(e)
        throw e
    }
}

export const stop = async (): Promise<void> => {
    const requestTime = log.debugTime("Stop Request")
    await LndMobile.stop()
    log.debugTime("Stop Response", requestTime)
}

export const getInfo = async (): Promise<lnrpc.GetInfoResponse> => {
    const response = await sendCommand<lnrpc.IGetInfoRequest, lnrpc.GetInfoRequest, lnrpc.GetInfoResponse>({
        request: lnrpc.GetInfoRequest,
        response: lnrpc.GetInfoResponse,
        method: "GetInfo",
        options: {}
    })
    return response
}

export const listPayments = async (
    includeIncomplete: boolean = false,
    indexOffset: Long = Long.fromValue(0)
): Promise<lnrpc.ListPaymentsResponse> => {
    const response = await sendCommand<lnrpc.IListPaymentsRequest, lnrpc.ListPaymentsRequest, lnrpc.ListPaymentsResponse>({
        request: lnrpc.ListPaymentsRequest,
        response: lnrpc.ListPaymentsResponse,
        method: "ListPayments",
        options: {
            includeIncomplete,
            indexOffset
        }
    })
    return response
}

export const listPeers = async (latestError: boolean = false): Promise<lnrpc.ListPeersResponse> => {
    const response = await sendCommand<lnrpc.IListPeersRequest, lnrpc.ListPeersRequest, lnrpc.ListPeersResponse>({
        request: lnrpc.ListPeersRequest,
        response: lnrpc.ListPeersResponse,
        method: "ListPeers",
        options: {
            latestError
        }
    })
    return response
}

export const subscribeInvoices = async (onData: SubscribeInvoicesType): Promise<lnrpc.Invoice> => {
    const stream = sendStreamCommand<lnrpc.IInvoiceSubscription, lnrpc.InvoiceSubscription, lnrpc.Invoice>({
        request: lnrpc.InvoiceSubscription,
        response: lnrpc.Invoice,
        method: "SubscribeInvoices",
        options: {}
    })
    const response = await new Promise<lnrpc.Invoice>((resolve, reject) => {
        stream.on("data", onData)
        stream.on("end", resolve)
        stream.on("error", reject)
        stream.on("status", (status) => log.info(`SubscribeInvoices: ${status}`))
    })
    return response
}

export const subscribeTransactions = async (onData: SubscribeTransactionsType): Promise<lnrpc.Transaction> => {
    const stream = sendStreamCommand<lnrpc.IGetTransactionsRequest, lnrpc.GetTransactionsRequest, lnrpc.Transaction>({
        request: lnrpc.GetTransactionsRequest,
        response: lnrpc.Transaction,
        method: "SubscribeTransactions",
        options: {}
    })
    const response = await new Promise<lnrpc.Transaction>((resolve, reject) => {
        stream.on("data", onData)
        stream.on("end", resolve)
        stream.on("error", reject)
        stream.on("status", (status) => log.info(`SubscribeTransactions: ${status}`))
    })
    return response
}
