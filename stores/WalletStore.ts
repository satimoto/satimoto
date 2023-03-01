import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { generateSecureRandom } from "react-native-securerandom"
import { lnrpc } from "proto/proto"
import { StoreInterface, Store } from "stores/Store"
import { genSeed, initWallet, sendCoins, unlockWallet, walletBalance } from "services/LightningService"
import { DEBUG } from "utils/build"
import { RECOVERY_WINDOW_DEFAULT, SECURE_KEY_WALLET_PASSWORD, SECURE_KEY_CIPHER_SEED_MNEMONIC } from "utils/constants"
import { bytesToBase64, toNumber } from "utils/conversion"
import { Log } from "utils/logging"
import { getSecureItem, setSecureItem } from "utils/storage"
import { SendCoinsProps } from "services/LightningService"

const log = new Log("WalletStore")

export interface WalletStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    totalBalance: number
    confirmedBalance: number
    unconfirmedBalance: number
    lockedBalance: number
    reservedBalance: number
    lastTxid?: string

    refreshWalletBalance(): Promise<void>
    sendCoins(request: SendCoinsProps): Promise<lnrpc.SendCoinsResponse>
}

export class WalletStore implements WalletStoreInterface {
    hydrated = false
    ready = false
    stores

    totalBalance: number = 0
    confirmedBalance: number = 0
    unconfirmedBalance: number = 0
    lockedBalance: number = 0
    reservedBalance: number = 0
    lastTxid?: string = undefined

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            totalBalance: observable,
            confirmedBalance: observable,
            unconfirmedBalance: observable,
            lockedBalance: observable,
            reservedBalance: observable,
            lastTxid: observable,

            actionSetReady: action,
            actionUpdateWalletBalance: action
        })

        makePersistable(
            this,
            {
                name: "WalletStore",
                properties: ["totalBalance", "confirmedBalance", "unconfirmedBalance", "lockedBalance", "reservedBalance", "lastTxid"],
                storage: AsyncStorage,
                debugMode: DEBUG
            },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    async initialize(): Promise<void> {
        try {
            // When the wallet not existing, create a wallet
            when(
                () => this.stores.lightningStore.state == lnrpc.WalletState.NON_EXISTING,
                () => this.createWallet()
            )

            // When the wallet is locked, unlock the wallet
            when(
                () => this.stores.lightningStore.state == lnrpc.WalletState.LOCKED,
                () => this.unlockWallet()
            )

            when(
                () => this.stores.lightningStore.syncedToChain,
                () => this.whenSyncedToChain()
            )
        } catch (error) {
            log.error(`SAT087: Error Initializing: ${error}`, true)
        }
    }

    async createWallet(): Promise<void> {
        let seedMnemonic: string[] = await getSecureItem(SECURE_KEY_CIPHER_SEED_MNEMONIC)
        let password: string = await getSecureItem(SECURE_KEY_WALLET_PASSWORD)
        const recoveryWindow: number = seedMnemonic ? RECOVERY_WINDOW_DEFAULT : 0

        // Create seed mnemonic
        if (!seedMnemonic) {
            const genSeedResponse: lnrpc.GenSeedResponse = await genSeed()
            seedMnemonic = genSeedResponse.cipherSeedMnemonic
            await setSecureItem(SECURE_KEY_CIPHER_SEED_MNEMONIC, seedMnemonic)
        }

        // Create wallet password
        if (!password) {
            const passwordBytes: Uint8Array = await generateSecureRandom(32)
            password = bytesToBase64(passwordBytes)
            await setSecureItem(SECURE_KEY_WALLET_PASSWORD, password)
        }

        log.debug(`SAT088: Seed: ${seedMnemonic.join(" ")}`)
        log.debug(`SAT088: Password: ${password}`)

        // Init wallet
        await initWallet(seedMnemonic, password, recoveryWindow)
    }

    async refreshWalletBalance(): Promise<void> {
        const walletBalanceResponse = await walletBalance()
        this.actionUpdateWalletBalance(walletBalanceResponse)
    }

    async sendCoins(request: SendCoinsProps): Promise<lnrpc.SendCoinsResponse> {
        const response = await sendCoins(request)

        this.actionSetLastTxid(response.txid)
        this.refreshWalletBalance()

        return response
    }

    async unlockWallet(): Promise<void> {
        const password: string = await getSecureItem(SECURE_KEY_WALLET_PASSWORD)
        await unlockWallet(password)
    }

    /*
     * Mobx actions and reactions
     */

    actionSetReady() {
        this.ready = true
    }

    actionSetLastTxid(txid: string) {
        this.lastTxid = txid

        log.debug(`SAT103: Send Coins TxID: ${this.lastTxid}`)
    }

    actionUpdateWalletBalance(data: lnrpc.WalletBalanceResponse) {
        this.totalBalance = toNumber(data.totalBalance)
        this.confirmedBalance = toNumber(data.confirmedBalance)
        this.unconfirmedBalance = toNumber(data.unconfirmedBalance)
        this.lockedBalance = toNumber(data.lockedBalance)
        this.reservedBalance = toNumber(data.reservedBalanceAnchorChan)

        log.debug(
            `SAT102: Wallet Balance: total ${this.totalBalance}, ` +
                `confirmed ${this.totalBalance}, unconfirmed ${this.totalBalance}, ` +
                `locked ${this.totalBalance}, reserved ${this.totalBalance}`
        )
    }

    async whenSyncedToChain(): Promise<void> {
        this.refreshWalletBalance()
    }
}
