
import TransactionStatus from "types/TransactionStatus"

export interface BaseTransactionModel {
    createdAt: string
    hash: string
    preimage?: string
    status: TransactionStatus
    valueMsat: string
    valueSat: string
}