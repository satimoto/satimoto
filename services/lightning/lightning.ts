import Long from "long"
import { NativeModules } from "react-native"
import { lnrpc } from "proto/proto"
import { sendCommand, sendStreamCommand, processStreamResponse } from "services/LndMobileService"
import { INVOICE_EXPIRY } from "utils/constants"
import { hexToBytes, toLong } from "utils/conversion"
import { Log } from "utils/logging"
import { BytesLikeType, LongLikeType } from "utils/types"

const log = new Log("Lightning")
const service = ""
const { LndMobile } = NativeModules

export type InvoiceStreamResponse = (data: lnrpc.Invoice) => void

export type TransactionStreamResponse = (data: lnrpc.Transaction) => void

export const start = async (): Promise<string> => {
    const requestTime = log.debugTime("Start Request")
    try {
        const response = await LndMobile.start()
        log.debugTime("Start Response", requestTime)
        return response
    } catch (e) {
        log.errorTime("Start Error", requestTime)
        log.error(JSON.stringify(e, undefined, 2))
        throw e
    }
}

export const stop = async (): Promise<void> => {
    const requestTime = log.debugTime("Stop Request")
    await LndMobile.stop()
    log.debugTime("Stop Response", requestTime)
}

export const addInvoice = (value: number, memo?: string, expiry: LongLikeType = INVOICE_EXPIRY): Promise<lnrpc.AddInvoiceResponse> => {
    return sendCommand<lnrpc.IInvoice, lnrpc.Invoice, lnrpc.AddInvoiceResponse>({
        request: lnrpc.Invoice,
        response: lnrpc.AddInvoiceResponse,
        method: service + "AddInvoice",
        options: {
            value: toLong(value),
            memo,
            expiry: toLong(expiry),
            private: true
        }
    })
}

export const getInfo = (): Promise<lnrpc.GetInfoResponse> => {
    return sendCommand<lnrpc.IGetInfoRequest, lnrpc.GetInfoRequest, lnrpc.GetInfoResponse>({
        request: lnrpc.GetInfoRequest,
        response: lnrpc.GetInfoResponse,
        method: service + "GetInfo",
        options: {}
    })
}

export const listPayments = (includeIncomplete: boolean = false, indexOffset: LongLikeType = 0): Promise<lnrpc.ListPaymentsResponse> => {
    return sendCommand<lnrpc.IListPaymentsRequest, lnrpc.ListPaymentsRequest, lnrpc.ListPaymentsResponse>({
        request: lnrpc.ListPaymentsRequest,
        response: lnrpc.ListPaymentsResponse,
        method: service + "ListPayments",
        options: {
            includeIncomplete,
            indexOffset: toLong(indexOffset)
        }
    })
}

export const listPeers = (latestError: boolean = false): Promise<lnrpc.ListPeersResponse> => {
    return sendCommand<lnrpc.IListPeersRequest, lnrpc.ListPeersRequest, lnrpc.ListPeersResponse>({
        request: lnrpc.ListPeersRequest,
        response: lnrpc.ListPeersResponse,
        method: service + "ListPeers",
        options: {
            latestError
        }
    })
}

export const signMessage = (msg: BytesLikeType): Promise<lnrpc.SignMessageResponse> => {
    return sendCommand<lnrpc.ISignMessageRequest, lnrpc.SignMessageRequest, lnrpc.SignMessageResponse>({
        request: lnrpc.SignMessageRequest,
        response: lnrpc.SignMessageResponse,
        method: service + "SignMessage",
        options: {
            msg: hexToBytes(msg)
        }
    })

}

export const subscribeInvoices = (onData: InvoiceStreamResponse): Promise<lnrpc.Invoice> => {
    const method = service + "SubscribeInvoices"
    const stream = sendStreamCommand<lnrpc.IInvoiceSubscription, lnrpc.InvoiceSubscription, lnrpc.Invoice>({
        request: lnrpc.InvoiceSubscription,
        response: lnrpc.Invoice,
        method,
        options: {}
    })
    return processStreamResponse<lnrpc.Invoice>({ stream, method, onData })
}

export const subscribeTransactions = async (onData: TransactionStreamResponse): Promise<lnrpc.Transaction> => {
    const method = service + "SubscribeTransactions"
    const stream = sendStreamCommand<lnrpc.IGetTransactionsRequest, lnrpc.GetTransactionsRequest, lnrpc.Transaction>({
        request: lnrpc.GetTransactionsRequest,
        response: lnrpc.Transaction,
        method,
        options: {}
    })
    return processStreamResponse<lnrpc.Transaction>({ stream, method, onData })
}
