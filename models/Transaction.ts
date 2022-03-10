import Long from "long"
import { observable, action, makeObservable, computed } from "mobx"
import InvoiceModel from "models/Invoice"
import PaymentModel from "models/Payment"
import { TransactionStatus, TransactionType } from "types/transaction"
import { Log } from "utils/logging"

const log = new Log("TransactionModel")

export type InvoicePaymentModel = InvoiceModel | PaymentModel

interface TransactionModelInterface {
    identifier?: string
    subtransactions: InvoicePaymentModel[]

    addTransaction(transaction: InvoicePaymentModel): void
    get createdAt(): string | null
    get feeMsat(): string
    get feeSat(): string
    get valueMsat(): string
    get valueSat(): string
}

export class TransactionModel implements TransactionModelInterface {
    identifier
    subtransactions

    constructor(transaction?: InvoicePaymentModel, identifier?: string) {
        this.identifier = identifier
        this.subtransactions = observable<InvoicePaymentModel>([])

        makeObservable(this, {
            subtransactions: observable,

            feeMsat: computed,
            feeSat: computed,
            valueMsat: computed,
            valueSat: computed,

            addTransaction: action
        })

        if (transaction) {
            this.addTransaction(transaction)
        }
    }

    addTransaction(transaction: InvoicePaymentModel) {
        let index = this.subtransactions.findIndex((t) => t.hash === transaction.hash)

        if (index === -1) {
            log.debug(`Add transaction: ${transaction.hash}`)
            this.subtransactions.unshift(transaction)
        } else {
            log.debug(`Replace transaction: ${transaction.hash}`)
            this.subtransactions.splice(index, 1, transaction)
        }

        if (!this.identifier) {
            this.identifier = transaction.hash
        }
    }

    get createdAt(): string | null {
        return this.subtransactions.length ? this.subtransactions[0].createdAt : null
    }

    get feeMsat(): string {
        return this.subtransactions
            .filter((transaction) => transaction.status !== TransactionStatus.SUCCEEDED)
            .reduce((feeMsat, transaction) => {
                const payment = transaction as PaymentModel
                return transaction.type === TransactionType.PAYMENT ? feeMsat.subtract(payment.feeMsat) : feeMsat
            }, new Long(0))
            .toString()
    }

    get feeSat(): string {
        return this.subtransactions
            .filter((transaction) => transaction.status !== TransactionStatus.SUCCEEDED)
            .reduce((feeSat, transaction) => {
                const payment = transaction as PaymentModel

                return transaction.type === TransactionType.PAYMENT ? feeSat.subtract(payment.feeSat) : feeSat
            }, new Long(0))
            .toString()
    }

    get valueMsat(): string {
        return this.subtransactions
            .filter((transaction) => transaction.status !== TransactionStatus.SUCCEEDED)
            .reduce((valueMsat, transaction) => {
                return transaction.type === TransactionType.INVOICE ? valueMsat.add(transaction.valueMsat) : valueMsat.subtract(transaction.valueMsat)
            }, new Long(0))
            .toString()
    }

    get valueSat(): string {
        return this.subtransactions
            .filter((transaction) => transaction.status !== TransactionStatus.SUCCEEDED)
            .reduce((valueSat, transaction) => {
                return transaction.type === TransactionType.INVOICE ? valueSat.add(transaction.valueSat) : valueSat.subtract(transaction.valueSat)
            }, new Long(0))
            .toString()
    }
}
