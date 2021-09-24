import { bytesToBase64 } from "byte-base64"
import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { generateSecureRandom } from "react-native-securerandom"
import { lnrpc } from "proto/proto"
import { IStore, Store } from "stores/Store"
import { genSeed, initWallet, unlockWallet } from "services/LightningService"
import { Debug } from "utils/build"
import { RECOVERY_WINDOW_DEFAULT, SECURE_KEY_WALLET_PASSWORD, SECURE_KEY_CIPHER_SEED_MNEMONIC } from "utils/constants"
import { Log } from "utils/logging"
import { getSecureItem, setSecureItem } from "utils/storage"

const log = new Log("WalletStore")

export interface IWalletStore extends IStore {
    hydrated: boolean
    stores: Store

    createWallet(): Promise<void>
    unlockWallet(): Promise<void>
}

export class WalletStore implements IWalletStore {
    // Store state
    hydrated = false
    ready = false
    stores
    // Wallet state

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            setReady: action
        })

        makePersistable(this, { name: "WalletStore", properties: [], storage: AsyncStorage, debugMode: Debug }, { delay: 1000 }).then(
            action((persistStore) => (this.hydrated = persistStore.isHydrated))
        )
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

        log.debug(`Seed: ${seedMnemonic.join(" ")}`)
        log.debug(`Password: ${password}`)

        // Init wallet
        await initWallet(seedMnemonic, password, recoveryWindow)
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
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    async unlockWallet(): Promise<void> {
        const password: string = await getSecureItem(SECURE_KEY_WALLET_PASSWORD)
        await unlockWallet(password)
    }

    setReady() {
        this.ready = true
    }
}
