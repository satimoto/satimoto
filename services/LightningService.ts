import type { InvoiceStreamResponse, TransactionStreamResponse } from "./lightning/lightning"
import type { BlockEpochStreamResponse } from "./lightning/chainNotifier"
import type { PaymentStreamResponse, SendPaymentV2Props } from "./lightning/router"

import {
    start,
    stop,
    addInvoice,
    connectPeer,
    decodePayReq, 
    disconnectPeer,
    getInfo,
    listPayments,
    listPeers,
    sendCustomMessage,
    signMessage,
    subscribeCustomMessages,
    subscribeInvoices,
    subscribePeerEvents,
    subscribeTransactions
} from "./lightning/lightning"
import { registerBlockEpochNtfn } from "./lightning/chainNotifier"
import { channelBalance, openChannel, subscribeChannelEvents } from "./lightning/channel"
import { sendPaymentV2 } from "./lightning/router"
import { getState, subscribeState } from "./lightning/state"
import { genSeed, initWallet, unlockWallet } from "./lightning/walletUnlocker"

export type {
    InvoiceStreamResponse,
    TransactionStreamResponse,
    // ChainNotifier
    BlockEpochStreamResponse,
    // Router
    PaymentStreamResponse,
    SendPaymentV2Props
}

export {
    start,
    stop,
    addInvoice,
    connectPeer,
    decodePayReq,
    disconnectPeer,
    getInfo,
    listPayments,
    listPeers,
    sendCustomMessage,
    signMessage,
    subscribeCustomMessages,
    subscribeInvoices,
    subscribePeerEvents,
    subscribeTransactions,
    // ChainNotifier
    registerBlockEpochNtfn,
    // Channel
    channelBalance,
    openChannel,
    subscribeChannelEvents,
    // Router
    sendPaymentV2,
    // State
    getState,
    subscribeState,
    // WalletUnlocker
    genSeed,
    initWallet,
    unlockWallet
}
