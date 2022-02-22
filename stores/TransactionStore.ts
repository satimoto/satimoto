import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { lnrpc } from "proto/proto"
import { IStore, Store } from "stores/Store"
import { subscribeTransactions } from "services/LightningService"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"

const log = new Log("TransactionStore")

export interface ITransactionStore extends IStore {
    hydrated: boolean
    stores: Store

    subscribedTransactions: boolean
}

export class TransactionStore implements ITransactionStore {
    hydrated = false
    ready = false
    stores

    subscribedTransactions = false

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            subscribedTransactions: observable,

            setReady: action
        })

        makePersistable(this, { name: "TransactionStore", properties: [], storage: AsyncStorage, debugMode: DEBUG }, { delay: 1000 }).then(
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
        if (!this.subscribedTransactions) {
            subscribeTransactions((data: lnrpc.Transaction) => this.updateTransactions(data))
            this.subscribedTransactions = true
        }
    }

    setReady() {
        this.ready = true
    }

    updateTransactions(data: lnrpc.Transaction) {}
}
