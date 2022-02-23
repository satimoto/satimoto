import Long from "long"
import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { chainrpc, lnrpc } from "proto/proto"
import { IStore, Store } from "stores/Store"
import { getInfo, start, registerBlockEpochNtfn, subscribeState, listPeers } from "services/LightningService"
import { startLogEvents } from "services/LndUtilsService"
import { DEBUG } from "utils/build"
import { bytesToHex, reverseByteOrder } from "utils/conversion"
import { Log } from "utils/logging"
import { timeout } from "utils/tools"

const log = new Log("LightningStore")

export interface ILightningStore extends IStore {
    hydrated: boolean
    stores: Store

    blockHeight: number
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

export class LightningStore implements ILightningStore {
    hydrated = false
    ready = false
    stores

    state = lnrpc.WalletState.WAITING_TO_START
    startedLogEvents = false
    subscribedBlockEpoch = false
    subscribedState = false
    blockHeight = 0
    bestHeaderTimestamp = "0"
    syncHeaderTimestamp = "0"
    syncedToChain = false
    percentSynced = 0

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            state: observable,
            startedLogEvents: observable,
            subscribedBlockEpoch: observable,
            subscribedState: observable,
            blockHeight: observable,
            bestHeaderTimestamp: observable,
            syncedToChain: observable,
            percentSynced: observable,

            calculatePercentSynced: action,
            setReady: action,
            setSyncHeaderTimestamp: action,
            updateBlockEpoch: action,
            updateInfo: action,
            updateState: action
        })

        makePersistable(
            this,
            { name: "LightningStore", properties: ["blockHeight", "bestHeaderTimestamp"], storage: AsyncStorage, debugMode: DEBUG },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    calculatePercentSynced() {
        if (this.syncHeaderTimestamp === "0") {
            this.setSyncHeaderTimestamp(this.bestHeaderTimestamp)
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

    async getInfo() {
        const getInfoResponse: lnrpc.GetInfoResponse = await getInfo()
        this.updateInfo(getInfoResponse)
    }

    async initialize(): Promise<void> {
        try {
            // Start LND
            const startReponse = await start()
            log.debug(startReponse)

            this.startLogEvents()

            // When the wallet is unlocked or RPC active, set the store ready
            when(
                () => this.state == lnrpc.WalletState.RPC_ACTIVE,
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

    subscribeBlockEpoch() {
        if (!this.subscribedBlockEpoch) {
            registerBlockEpochNtfn((data) => this.updateBlockEpoch(data))
            this.subscribedBlockEpoch = true
        }
    }

    subscribeState() {
        if (!this.subscribedState) {
            subscribeState((data) => this.updateState(data))
            this.subscribedState = true
        }
    }

    setReady() {
        this.ready = true
    }

    setSyncHeaderTimestamp(timestamp: string) {
        this.syncHeaderTimestamp = timestamp
    }

    startLogEvents() {
        if (DEBUG && !this.startedLogEvents) {
            startLogEvents()
            this.startedLogEvents = true
        }
    }

    async syncToChain() {
        this.setSyncHeaderTimestamp(this.bestHeaderTimestamp)

        while (true) {
            await this.getInfo()
            this.calculatePercentSynced()

            if (this.syncedToChain) {
                break
            }

            await timeout(6000)
        }

        await listPeers()

        this.setReady()
    }

    updateBlockEpoch({ hash }: chainrpc.BlockEpoch) {
        const reversedHash = reverseByteOrder(hash)
        const hex = bytesToHex(reversedHash)
        log.debug(`Hex: ${hex}`)
        this.getInfo()
    }

    updateChannels() {}

    updateInfo({ blockHeight, bestHeaderTimestamp, syncedToChain }: lnrpc.GetInfoResponse) {
        this.blockHeight = blockHeight
        this.bestHeaderTimestamp = bestHeaderTimestamp.toString()
        this.syncedToChain = syncedToChain
    }

    updateState({ state }: lnrpc.SubscribeStateResponse) {
        log.debug(`State: ${state}`)
        this.state = state
    }
}
