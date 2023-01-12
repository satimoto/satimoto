import Long from "long"
import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { chainrpc, lnrpc } from "proto/proto"
import { StoreInterface, Store } from "stores/Store"
import { getInfo, start, registerBlockEpochNtfn, subscribeState } from "services/LightningService"
import { startLogEvents } from "services/LndUtilsService"
import { DEBUG } from "utils/build"
import { bytesToHex, reverseByteOrder } from "utils/conversion"
import { Log } from "utils/logging"
import { timeout } from "utils/tools"

const log = new Log("LightningStore")

export interface LightningStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    blockHeight: number
    identityPubkey?: string
    state: lnrpc.WalletState
    startedLogEvents: boolean
    subscribedBlockEpoch: boolean
    subscribedState: boolean
    bestHeaderTimestamp: string
    syncHeaderTimestamp: string
    syncedToChain: boolean
    percentSynced: number

    getInfo(): void
    syncToChain(): void
}

export class LightningStore implements LightningStoreInterface {
    hydrated = false
    ready = false
    stores

    blockHeight = 0
    identityPubkey?: string = undefined
    state = lnrpc.WalletState.WAITING_TO_START
    startedLogEvents = false
    subscribedBlockEpoch = false
    subscribedState = false
    bestHeaderTimestamp = "0"
    syncHeaderTimestamp = "0"
    syncedToChain = false
    percentSynced = 0

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            blockHeight: observable,
            identityPubkey: observable,
            state: observable,
            startedLogEvents: observable,
            subscribedBlockEpoch: observable,
            subscribedState: observable,
            bestHeaderTimestamp: observable,
            syncedToChain: observable,
            percentSynced: observable,

            actionBlockEpochReceived: action,
            actionCalculatePercentSynced: action,
            actionSetReady: action,
            actionSetSyncHeaderTimestamp: action,
            actionUpdateInfo: action,
            actionStateReceived: action
        })

        makePersistable(
            this,
            { name: "LightningStore", properties: ["identityPubkey", "blockHeight", "bestHeaderTimestamp"], storage: AsyncStorage, debugMode: DEBUG },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    async initialize(): Promise<void> {
        try {
            // Start LND
            const startReponse = await start()
            log.debug(startReponse)

            this.startLogEvents()

            // When the wallet is unlocked or RPC active, set the store ready
            when(
                () => this.state == lnrpc.WalletState.RPC_ACTIVE || this.state == lnrpc.WalletState.SERVER_ACTIVE,
                () => this.syncToChain()
            )

            when(
                () => this.syncedToChain,
                () => this.subscribeBlockEpoch()
            )

            this.subscribeState()
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    async getInfo() {
        const getInfoResponse: lnrpc.GetInfoResponse = await getInfo()
        this.actionUpdateInfo(getInfoResponse)
    }

    startLogEvents() {
        if (DEBUG && !this.startedLogEvents) {
            startLogEvents()
            this.startedLogEvents = true
        }
    }

    subscribeBlockEpoch() {
        if (!this.subscribedBlockEpoch) {
            registerBlockEpochNtfn((data) => this.actionBlockEpochReceived(data))
            this.subscribedBlockEpoch = true
        }
    }

    subscribeState() {
        if (!this.subscribedState) {
            subscribeState((data) => this.actionStateReceived(data))
            this.subscribedState = true
        }
    }

    async syncToChain() {
        this.actionSetSyncHeaderTimestamp(this.bestHeaderTimestamp)

        while (true) {
            await this.getInfo()
            this.actionCalculatePercentSynced()

            if (this.syncedToChain) {
                break
            }

            await timeout(6000)
        }

        this.actionSetReady()
    }

    updateChannels() {}

    /*
     * Mobx actions and reactions
     */

    actionBlockEpochReceived({ hash }: chainrpc.BlockEpoch) {
        const reversedHash = reverseByteOrder(hash)
        const hex = bytesToHex(reversedHash)
        log.debug(`Hex: ${hex}`)
        this.getInfo()
    }

    actionCalculatePercentSynced() {
        if (this.syncHeaderTimestamp === "0") {
            this.actionSetSyncHeaderTimestamp(this.bestHeaderTimestamp)
        }

        if (this.syncedToChain) {
            this.percentSynced = 100
        } else {
            const bestHeaderTimestamp = Long.fromString(this.bestHeaderTimestamp)
            const syncHeaderTimestamp = Long.fromString(this.syncHeaderTimestamp)
            const timestamp = Long.fromValue(new Date().getTime() / 1000)
            const progress = bestHeaderTimestamp.subtract(syncHeaderTimestamp).toNumber()
            const total = timestamp.subtract(syncHeaderTimestamp).toNumber()
            this.percentSynced = (100.0 / total) * progress
        }

        log.debug(`Percent Synced: ${this.percentSynced}`)
    }

    actionStateReceived({ state }: lnrpc.SubscribeStateResponse) {
        log.debug(`State: ${state}`)
        this.state = state
    }

    actionSetReady() {
        this.ready = true
    }

    actionSetSyncHeaderTimestamp(timestamp: string) {
        this.syncHeaderTimestamp = timestamp
    }

    actionUpdateInfo({ blockHeight, bestHeaderTimestamp, identityPubkey, syncedToChain }: lnrpc.GetInfoResponse) {
        this.blockHeight = blockHeight
        this.identityPubkey = identityPubkey
        this.bestHeaderTimestamp = bestHeaderTimestamp.toString()
        this.syncedToChain = syncedToChain
    }
}
