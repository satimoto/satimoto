import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { lnrpc } from "proto/proto"
import { IStore, Store } from "stores/Store"
import { subscribeTransactions } from "services/LightningService"
import { Debug } from "utils/build"
import { Log } from "utils/logging"

const log = new Log("TransactionStore")

export interface ITransactionStore extends IStore {
    hydrated: boolean
    stores: Store

    subscribeTransactions(): void
    updateTransactions(data: lnrpc.Transaction): void
}

export class TransactionStore implements ITransactionStore {
    // Store state
    hydrated = false
    ready = false
    stores
    // Transaction state

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            setReady: action
        })

        makePersistable(this, { name: "TransactionStore", properties: [], storage: AsyncStorage, debugMode: Debug }, { delay: 1000 }).then(
            action((persistStore) => (this.hydrated = persistStore.isHydrated))
        )
    }

    async initialize(): Promise<void> {
        try {
            // When the synced to chain, subscribe to transactions
            when(
                () => this.stores.lightningStore.syncedToChain,
                () => this.subscribeTransactions()
            )
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    subscribeTransactions() {
        subscribeTransactions((data: lnrpc.Transaction) => this.updateTransactions(data))
    }

    setReady() {
        this.ready = true
    }

    updateTransactions(data: lnrpc.Transaction) {}
}
