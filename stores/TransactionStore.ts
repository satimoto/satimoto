import { action, makeObservable, observable } from "mobx"
import { makePersistable } from "mobx-persist-store"
import { StoreInterface, Store } from "stores/Store"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"
import AsyncStorage from "@react-native-async-storage/async-storage"
import TransactionModel from "models/Transaction"
import { InvoiceStatus } from "types/invoice"
import moment from "moment"
import { PaymentStatus } from "types/payment"

const log = new Log("TransactionStore")

export interface TransactionStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    transactions: TransactionModel[]

    addTransaction(transaction: TransactionModel): void
    clearTransactions(): void
    clearFailedTransactions(): void
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

            actionSetReady: action,
            actionAddTransaction: action,
            actionClearTransactions: action,
            actionClearFailedTransactions: action,
            actionCheckExpiredTransactions: action
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
            this.actionCheckExpiredTransactions()
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    addTransaction(transaction: TransactionModel) {
        this.actionAddTransaction(transaction)
    }


    clearTransactions() {
        this.actionClearTransactions()
    }

    clearFailedTransactions() {
        this.clearFailedTransactions()
    }

    /*
     * Mobx actions and reactions
     */

    actionAddTransaction(transaction: TransactionModel) {
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

    actionCheckExpiredTransactions() {
        const now = moment()
        const openInvoiceStatuses = [InvoiceStatus.ACCEPTED, InvoiceStatus.OPEN]
        const openPaymentStatuses = [PaymentStatus.IN_PROGRESS, PaymentStatus.UNKNOWN]

        for (const { invoice, payment } of this.transactions) {
            if (invoice && openInvoiceStatuses.includes(invoice.status) && moment(invoice.expiresAt).isBefore(now)) {
                invoice.status = InvoiceStatus.EXPIRED
            }
            if (payment && openPaymentStatuses.includes(payment.status) && moment(payment.expiresAt).isBefore(now)) {
                payment.status = PaymentStatus.EXPIRED
            }
        }
    }
    
    actionClearTransactions() {
        this.transactions.clear()
    }

    actionClearFailedTransactions() {
        this.transactions.replace(
            this.transactions.filter(({ invoice, payment }) => {
                return (
                    (invoice && invoice.status !== InvoiceStatus.CANCELLED && invoice.status !== InvoiceStatus.EXPIRED) ||
                    (payment && payment.status !== PaymentStatus.EXPIRED && payment.status !== PaymentStatus.FAILED)
                )
            })
        )
    }

    actionSetReady() {
        this.ready = true
    }
}
