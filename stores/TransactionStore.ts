import { action, makeObservable, observable } from "mobx"
import { makePersistable } from "mobx-persist-store"
import { lnrpc } from "proto/proto"
import { StoreInterface, Store } from "stores/Store"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"
import AsyncStorage from "@react-native-async-storage/async-storage"
import TransactionModel from "models/Transaction"

const log = new Log("TransactionStore")

export interface TransactionStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    transactions: TransactionModel[]

    addTransaction(transaction: TransactionModel): void
    clearTransactions(): void
}

export class TransactionStore implements TransactionStoreInterface {
    hydrated = false
    ready = false
    stores

    transactions

    constructor(stores: Store) {
        this.stores = stores
        this.transactions = observable<TransactionModel>([])

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            transactions: observable,

            setReady: action,
            addTransaction: action,
            clearTransactions: action
        })

        makePersistable(
            this,
            {
                name: "TransactionStore",
                properties: ["transactions"],
                storage: AsyncStorage,
                debugMode: DEBUG
            },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    async initialize(): Promise<void> {
        try {
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    addTransaction(transaction: TransactionModel) {
        let existingTransaction = this.transactions.find(
            ({ invoice, payment }) =>
                (transaction.invoice && invoice && transaction.invoice.hash === invoice.hash) ||
                (transaction.payment && payment && transaction.payment.hash === payment.hash)
        )

        if (existingTransaction) {
            Object.assign(existingTransaction, transaction)
        } else {
            this.transactions.unshift(transaction)
        }
    }

    clearTransactions() {
        this.transactions.clear()
    }

    setReady() {
        this.ready = true
    }

    updateTransactions(data: lnrpc.Transaction) {}
}
