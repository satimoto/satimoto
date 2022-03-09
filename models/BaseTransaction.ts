import { TransactionStatus, TransactionType } from "types/transaction"

export interface BaseTransactionModel {
    createdAt: string
    hash: string
    preimage?: string
    status: TransactionStatus
    type: TransactionType
    valueMsat: string
    valueSat: string
}
