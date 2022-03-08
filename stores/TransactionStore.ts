import { instanceToPlain, plainToInstance } from "class-transformer"
import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import { InvoicePaymentModel, TransactionModel } from "models/Transaction"
import { lnrpc } from "proto/proto"
import { StoreInterface, Store } from "stores/Store"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"
import { ComplexAsyncStorage, ComplexAsyncStorageHydrationMap } from "utils/asyncStorage"

const log = new Log("TransactionStore")

export interface TransactionStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    transactions: TransactionModel[]

    addTransaction(transaction: InvoicePaymentModel): void
}

const transactionDehydrationMap: ComplexAsyncStorageHydrationMap = {
    transactions: (value: TransactionModel[]): any => {
        return instanceToPlain(value)
    }
}

const transactionHydrationMap: ComplexAsyncStorageHydrationMap = {
    transactions: (value: any): TransactionModel[] => {
        return plainToInstance(TransactionModel, value, { excludeExtraneousValues: true })
    }
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
            addTransaction: action
        })

        makePersistable(
            this,
            {
                name: "TransactionStore",
                properties: ["transactions"],
                storage: ComplexAsyncStorage(transactionHydrationMap, transactionDehydrationMap),
                stringify: false,
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

    addTransaction(transaction: InvoicePaymentModel, identifier?: string) {
        identifier = identifier || transaction.hash

        const existingTransaction = this.transactions.find((t) => t.identifier === identifier)

        if (existingTransaction) {
            existingTransaction.addTransaction(transaction)
        } else {
            this.transactions.push(new TransactionModel(transaction, identifier))
        }
    }

    setReady() {
        this.ready = true
    }

    updateTransactions(data: lnrpc.Transaction) {}
}
