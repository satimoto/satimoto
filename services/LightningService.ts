import type { SubscribeInvoicesStreamResponse, SubscribeTransactionsStreamResponse } from "./lightning/lightning"
import type { PaymentStreamResponse } from "./lightning/router"

import { start, stop, getInfo, listPayments, listPeers, subscribeInvoices, subscribeTransactions } from "./lightning/lightning"
import { openChannel } from "./lightning/channel"
import { sendPaymentV2 } from "./lightning/router"
import { getState, subscribeState } from "./lightning/state"
import { genSeed, initWallet, unlockWallet } from "./lightning/wallet"

export type {
    SubscribeInvoicesStreamResponse,
    SubscribeTransactionsStreamResponse,
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
    // Channel
    openChannel,
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
