import AsyncStorage from "@react-native-async-storage/async-storage"
import { generateSecureRandom } from "react-native-securerandom"
import { bytesToBase64 } from "byte-base64"
import Long from "long";
import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import { lnrpc } from "proto/proto"
import { IStore, Store } from "stores/Store"
import { genSeed, getInfo, initWallet, start, subscribeState, unlockWallet, listPeers } from "services/LightningService"
import { startLogEvents } from "services/LndUtilsService"
import { Debug } from "utils/build"
import { SECURE_KEY_WALLET_PASSWORD, SECURE_KEY_CIPHER_SEED_MNEMONIC } from "utils/constants"
import { Log } from "utils/logging"
import { getSecureItem, setSecureItem } from "utils/storage"
import { timeout } from "utils/tools"
import { TOUCHABLE_STATE } from "react-native-gesture-handler/lib/typescript/components/touchables/GenericTouchable";

const log = new Log("LightningStore")

export interface ILightningStore extends IStore {
    hydrated: boolean
    stores: Store
    blockHeight: number
    state: lnrpc.WalletState
    bestHeaderTimestamp: Long
    syncHeaderTimestamp: Long
    syncedToChain: boolean
    percentSynced: number

    createWallet(): Promise<void>
    unlockWallet(): Promise<void>
    getInfo(): void
    syncToChain(): Promise<void>
    calculatePercentSynced(): void
    updateChannels(): void
    updateState(data: lnrpc.SubscribeStateResponse): void
}

export class LightningStore implements ILightningStore {
    // Store state
    hydrated = false
    ready = false
    stores
    // Lightning state
    state = lnrpc.WalletState.WAITING_TO_START
    blockHeight = 0
    bestHeaderTimestamp = Long.fromNumber(0)
    syncHeaderTimestamp = Long.fromNumber(0)
    syncedToChain = false
    percentSynced = 0

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,
            state: observable,
            blockHeight: observable,
            bestHeaderTimestamp: observable,
            syncedToChain: observable,
            percentSynced: observable,

            calculatePercentSynced: action,
            getInfo: action,
            setReady: action,
            syncToChain: action,
            updateState: action
        })

        makePersistable(this, { name: "LightningStore", properties: [], storage: AsyncStorage, debugMode: Debug }, { delay: 1000 }).then(
            action((persistStore) => (this.hydrated = persistStore.isHydrated))
        )
    }

    async initialize(): Promise<void> {
        try {

            // Start LND
            await start()

            if (Debug) {
                startLogEvents()
            }

            // When the wallet not existing, create a wallet
            when(
                () => this.state == lnrpc.WalletState.NON_EXISTING,
                () => this.createWallet()
            )

            // When the wallet is locked, unlock the wallet
            when(
                () => this.state == lnrpc.WalletState.LOCKED,
                () => this.unlockWallet()
            )

            // When the wallet is unlocked or RPC active, set the store ready
            when(
                () => this.state == lnrpc.WalletState.RPC_ACTIVE,
                () => this.syncToChain()
            )

            // Subscribe to state
            subscribeState()
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    async createWallet(): Promise<void> {
        let seedMnemonic: string[] = await getSecureItem(SECURE_KEY_CIPHER_SEED_MNEMONIC)
        let password: string = await getSecureItem(SECURE_KEY_WALLET_PASSWORD)
        const recoveryWindow: number = (seedMnemonic ? 144 : 0)

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

    async unlockWallet(): Promise<void> {
        const password: string = await getSecureItem(SECURE_KEY_WALLET_PASSWORD)
        await unlockWallet(password)
    }

    async getInfo() {
        const getInfoResponse: lnrpc.GetInfoResponse = await getInfo()
        this.blockHeight = getInfoResponse.blockHeight
        this.bestHeaderTimestamp = Long.fromValue(getInfoResponse.bestHeaderTimestamp)
        this.syncedToChain = getInfoResponse.syncedToChain
    }

    async syncToChain(): Promise<void> {
        this.syncHeaderTimestamp = this.bestHeaderTimestamp

        while (true) {
            await this.getInfo()

            if (this.syncHeaderTimestamp.equals(0)) {
                this.syncHeaderTimestamp = this.bestHeaderTimestamp
            }

            this.calculatePercentSynced()
            log.debug(`Percent Synced: ${this.percentSynced}`)

            if (this.syncedToChain) {
                break
            }

            await timeout(6000)
        }

        await listPeers()

        this.setReady()
    }

    calculatePercentSynced() {
        const timestamp = Long.fromValue(new Date().getTime() / 1000)
        const progress = this.bestHeaderTimestamp.subtract(this.syncHeaderTimestamp).toNumber()
        const total = timestamp.subtract(this.syncHeaderTimestamp).toNumber()
        this.percentSynced = (100.0 / total) * progress
    }

    updateState({ state }: lnrpc.SubscribeStateResponse) {
        log.debug(`State: ${state}`)
        this.state = state
    }

    setReady() {
        this.ready = true
    }

    updateChannels() {}
}
