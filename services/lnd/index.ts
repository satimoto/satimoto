import type { InvoiceStreamResponse, TransactionStreamResponse } from "./lightning"
import type { BlockEpochStreamResponse } from "./chainNotifier"
import type { CloseChannelProps, ChannelAcceptor } from "./channel"
import type { PaymentStreamResponse, SendPaymentV2Props } from "./router"
import type { SendCoinsProps } from "./wallet"

import {
    start,
    stop,
    addInvoice,
    connectPeer,
    decodePayReq,
    describeGraph,
    disconnectPeer,
    getInfo,
    getNodeInfo,
    listPayments,
    listPeers,
    sendCustomMessage,
    signMessage,
    subscribeCustomMessages,
    subscribeInvoices,
    subscribePeerEvents,
    subscribeTransactions,
    verifyMessage
} from "./lightning"
import { registerBlockEpochNtfn } from "./chainNotifier"
import { closeChannel, closedChannels, channelAcceptor, channelBalance, listChannels, openChannel, subscribeChannelEvents } from "./channel"
import { markEdgeLive, resetMissionControl, sendPaymentV2 } from "./router"
import { getState, subscribeState } from "./state"
import { genSeed, initWallet, sendCoins, unlockWallet, walletBalance } from "./wallet"

export type {
    InvoiceStreamResponse,
    TransactionStreamResponse,
    // ChainNotifier
    BlockEpochStreamResponse,
    // Channel
    CloseChannelProps,
    ChannelAcceptor,
    // Router
    PaymentStreamResponse,
    SendPaymentV2Props,
    // Wallet
    SendCoinsProps
}

export {
    start,
    stop,
    addInvoice,
    connectPeer,
    decodePayReq,
    describeGraph,
    disconnectPeer,
    getInfo,
    getNodeInfo,
    listPayments,
    listPeers,
    sendCustomMessage,
    signMessage,
    subscribeCustomMessages,
    subscribeInvoices,
    subscribePeerEvents,
    subscribeTransactions,
    verifyMessage,
    // ChainNotifier
    registerBlockEpochNtfn,
    // Channel
    closeChannel,
    closedChannels,
    channelAcceptor,
    channelBalance,
    listChannels,
    openChannel,
    subscribeChannelEvents,
    // Router
    markEdgeLive,
    resetMissionControl,
    sendPaymentV2,
    // State
    getState,
    subscribeState,
    // Wallet
    genSeed,
    initWallet,
    sendCoins,
    unlockWallet,
    walletBalance
}
