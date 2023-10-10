import { lnrpc } from "proto/proto"

export enum WalletState {
    NON_EXISTING = "NON_EXISTING",
    LOCKED = "LOCKED",
    UNLOCKED = "UNLOCKED",
    STARTED = "STARTED",
    WAITING_TO_START = "WAITING_TO_START"
}

const fromLndWalletState = (state: lnrpc.WalletState): WalletState => {
    switch (state) {
        case lnrpc.WalletState.NON_EXISTING:
            return WalletState.NON_EXISTING
        case lnrpc.WalletState.LOCKED:
            return WalletState.LOCKED
        case lnrpc.WalletState.UNLOCKED:
            return WalletState.UNLOCKED
        case lnrpc.WalletState.RPC_ACTIVE:
        case lnrpc.WalletState.SERVER_ACTIVE:
            return WalletState.STARTED
    }

    return WalletState.WAITING_TO_START
}

export { fromLndWalletState }
