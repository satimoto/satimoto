import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { lnrpc } from "proto/proto"
import { IStore, Store } from "stores/Store"
import { subscribeInvoices } from "services/LightningService"
import { Debug } from "utils/build"
import { Log } from "utils/logging"

const log = new Log("InvoiceStore")

export interface IInvoiceStore extends IStore {
    hydrated: boolean
    stores: Store

    subscribeInvoices(): void
    updateInvoices(data: lnrpc.Invoice): void
}

export class InvoiceStore implements IInvoiceStore {
    // Store state
    hydrated = false
    ready = false
    stores
    // Invoice state

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            setReady: action
        })

        makePersistable(this, { name: "InvoiceStore", properties: [], storage: AsyncStorage, debugMode: Debug }, { delay: 1000 }).then(
            action((persistStore) => (this.hydrated = persistStore.isHydrated))
        )
    }

    async initialize(): Promise<void> {
        try {
            // When the synced to chain, subscribe to transactions
            when(
                () => this.stores.lightningStore.syncedToChain,
                () => this.subscribeInvoices()
            )
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    subscribeInvoices() {
        subscribeInvoices((data: lnrpc.Invoice) => this.updateInvoices(data))
    }

    setReady() {
        this.ready = true
    }

    updateInvoices(data: lnrpc.Invoice) {}
}
