import type { InvoiceStreamResponse, TransactionStreamResponse } from "./lightning/lightning"
import type { BlockEpochStreamResponse } from "./lightning/chain"
import type { PaymentStreamResponse } from "./lightning/router"

import { start, stop, getInfo, listPayments, listPeers, subscribeInvoices, subscribeTransactions } from "./lightning/lightning"
import { registerBlockEpochNtfn } from "./lightning/chain"
import { channelBalance, openChannel, subscribeChannelEvents } from "./lightning/channel"
import { sendPaymentV2 } from "./lightning/router"
import { getState, subscribeState } from "./lightning/state"
import { genSeed, initWallet, unlockWallet } from "./lightning/wallet"

export type {
    InvoiceStreamResponse,
    TransactionStreamResponse,
    // Chain
    BlockEpochStreamResponse,
    // Router
    PaymentStreamResponse
}

export {
    start,
    stop,
    getInfo,
    listPayments,
    listPeers,
    subscribeInvoices,
    subscribeTransactions,
    // Chain
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
    // Wallet
    genSeed,
    initWallet,
    unlockWallet
}
