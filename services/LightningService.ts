import { start, stop, getInfo, listPeers } from "./lightning/lightning"
import { openChannel } from "./lightning/channel"
import { getState, subscribeState } from "./lightning/state"
import { genSeed, initWallet, unlockWallet } from "./lightning/wallet"

export {
    // Lightning
    start,
    stop,
    getInfo,
    listPeers,

    // Channel
    openChannel,

    // State
    getState,
    subscribeState,

    // Wallet
    genSeed,
    initWallet,
    unlockWallet
}
