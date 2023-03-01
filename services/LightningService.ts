import type { InvoiceStreamResponse, TransactionStreamResponse } from "./lightning/lightning"
import type { BlockEpochStreamResponse } from "./lightning/chainNotifier"
import type { CloseChannelProps, ChannelAcceptor } from "./lightning/channel"
import type { PaymentStreamResponse, SendPaymentV2Props } from "./lightning/router"
import type { SendCoinsProps } from "./lightning/wallet"

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
} from "./lightning/lightning"
import { registerBlockEpochNtfn } from "./lightning/chainNotifier"
import { closeChannel, closedChannels, channelAcceptor, channelBalance, listChannels, openChannel, subscribeChannelEvents } from "./lightning/channel"
import { markEdgeLive, resetMissionControl, sendPaymentV2 } from "./lightning/router"
import { getState, subscribeState } from "./lightning/state"
import { genSeed, initWallet, sendCoins, unlockWallet, walletBalance } from "./lightning/wallet"

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
