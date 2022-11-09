import Long from "long"
import { NativeModules } from "react-native"
import { lnrpc } from "proto/proto"
import { sendCommand, sendStreamCommand, sendStreamResponse } from "services/LndMobileService"
import { INVOICE_EXPIRY } from "utils/constants"
import { hexToBytes, toLong } from "utils/conversion"
import { Log } from "utils/logging"
import { BytesLikeType, LongLikeType } from "utils/types"

const log = new Log("Lightning")
const service = ""
const { LndMobile } = NativeModules

export type CustomMessageStreamResponse = (data: lnrpc.CustomMessage) => void
export type InvoiceStreamResponse = (data: lnrpc.Invoice) => void
export type PeerStreamResponse = (data: lnrpc.PeerEvent) => void
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

interface AddInvoiceProps {
    value?: number
    valueMsat?: number
    expiry?: number
    memo?: string
    paymentAddr?: BytesLikeType
    preimage?: BytesLikeType
    routeHints?: lnrpc.RouteHint[]
}

export const addInvoice = ({
    value,
    valueMsat,
    memo,
    expiry = INVOICE_EXPIRY,
    paymentAddr,
    preimage,
    routeHints
}: AddInvoiceProps): Promise<lnrpc.AddInvoiceResponse> => {
    return sendCommand<lnrpc.IInvoice, lnrpc.Invoice, lnrpc.AddInvoiceResponse>({
        request: lnrpc.Invoice,
        response: lnrpc.AddInvoiceResponse,
        method: service + "AddInvoice",
        options: {
            value: value ? toLong(value) : null,
            valueMsat: valueMsat ? toLong(valueMsat) : null,
            memo,
            expiry: toLong(expiry),
            rPreimage: preimage ? hexToBytes(preimage) : null,
            paymentAddr: paymentAddr ? hexToBytes(paymentAddr) : null,
            private: !(routeHints && routeHints.length > 0),
            routeHints
        }
    })
}

export const connectPeer = (pubkey: string, host: string, perm: boolean = false, timeout?: number): Promise<lnrpc.ConnectPeerResponse> => {
    return sendCommand<lnrpc.IConnectPeerRequest, lnrpc.ConnectPeerRequest, lnrpc.ConnectPeerResponse>({
        request: lnrpc.ConnectPeerRequest,
        response: lnrpc.ConnectPeerResponse,
        method: service + "ConnectPeer",
        options: {
            addr: {
                pubkey,
                host
            },
            perm,
            timeout: timeout ? toLong(timeout) : null
        }
    })
}

export const decodePayReq = (payReq: string): Promise<lnrpc.PayReq> => {
    return sendCommand<lnrpc.IPayReqString, lnrpc.PayReqString, lnrpc.PayReq>({
        request: lnrpc.PayReqString,
        response: lnrpc.PayReq,
        method: service + "DecodePayReq",
        options: {
            payReq
        }
    })
}

export const disconnectPeer = (pubkey: string): Promise<lnrpc.DisconnectPeerResponse> => {
    return sendCommand<lnrpc.IDisconnectPeerRequest, lnrpc.DisconnectPeerRequest, lnrpc.DisconnectPeerResponse>({
        request: lnrpc.DisconnectPeerRequest,
        response: lnrpc.DisconnectPeerResponse,
        method: service + "DisconnectPeer",
        options: {
            pubKey: pubkey
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

export const sendCustomMessage = (peer: BytesLikeType, type: number, data: BytesLikeType): Promise<lnrpc.SendCustomMessageResponse> => {
    return sendCommand<lnrpc.ISendCustomMessageRequest, lnrpc.SendCustomMessageRequest, lnrpc.SendCustomMessageResponse>({
        request: lnrpc.SendCustomMessageRequest,
        response: lnrpc.SendCustomMessageResponse,
        method: service + "SendCustomMessage",
        options: {
            peer: hexToBytes(peer),
            type,
            data: hexToBytes(data)
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

export const subscribeCustomMessages = (onData: CustomMessageStreamResponse): Promise<lnrpc.SubscribeCustomMessagesRequest> => {
    const method = service + "SubscribeCustomMessages"
    const stream = sendStreamCommand<lnrpc.ISubscribeCustomMessagesRequest, lnrpc.SubscribeCustomMessagesRequest, lnrpc.CustomMessage>({
        request: lnrpc.SubscribeCustomMessagesRequest,
        response: lnrpc.CustomMessage,
        method,
        options: {}
    })
    return sendStreamResponse<lnrpc.CustomMessage>({ stream, method, onData })
}

export const subscribeInvoices = (
    onData: InvoiceStreamResponse,
    addIndex: LongLikeType = 0,
    settleIndex: LongLikeType = 0
): Promise<lnrpc.Invoice> => {
    const method = service + "SubscribeInvoices"
    const stream = sendStreamCommand<lnrpc.IInvoiceSubscription, lnrpc.InvoiceSubscription, lnrpc.Invoice>({
        request: lnrpc.InvoiceSubscription,
        response: lnrpc.Invoice,
        method,
        options: {
            addIndex: toLong(addIndex),
            settleIndex: toLong(settleIndex)
        }
    })
    return sendStreamResponse<lnrpc.Invoice>({ stream, method, onData })
}

export const subscribePeerEvents = async (onData: PeerStreamResponse): Promise<lnrpc.PeerEvent> => {
    const method = service + "SubscribePeerEvents"
    const stream = sendStreamCommand<lnrpc.IPeerEventSubscription, lnrpc.PeerEventSubscription, lnrpc.PeerEvent>({
        request: lnrpc.PeerEventSubscription,
        response: lnrpc.PeerEvent,
        method,
        options: {}
    })
    return sendStreamResponse<lnrpc.PeerEvent>({ stream, method, onData })
}

export const subscribeTransactions = async (onData: TransactionStreamResponse): Promise<lnrpc.Transaction> => {
    const method = service + "SubscribeTransactions"
    const stream = sendStreamCommand<lnrpc.IGetTransactionsRequest, lnrpc.GetTransactionsRequest, lnrpc.Transaction>({
        request: lnrpc.GetTransactionsRequest,
        response: lnrpc.Transaction,
        method,
        options: {}
    })
    return sendStreamResponse<lnrpc.Transaction>({ stream, method, onData })
}
