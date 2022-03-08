import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { generateSecureRandom } from "react-native-securerandom"
import { lnrpc } from "proto/proto"
import { StoreInterface, Store } from "stores/Store"
import { genSeed, initWallet, unlockWallet } from "services/LightningService"
import { DEBUG } from "utils/build"
import { RECOVERY_WINDOW_DEFAULT, SECURE_KEY_WALLET_PASSWORD, SECURE_KEY_CIPHER_SEED_MNEMONIC } from "utils/constants"
import { bytesToBase64 } from "utils/conversion"
import { Log } from "utils/logging"
import { getSecureItem, setSecureItem } from "utils/storage"

const log = new Log("WalletStore")

export interface WalletStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store
}

export class WalletStore implements WalletStoreInterface {
    hydrated = false
    ready = false
    stores

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            setReady: action
        })

        makePersistable(this, { name: "WalletStore", properties: [], storage: AsyncStorage, debugMode: DEBUG }, { delay: 1000 }).then(
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
