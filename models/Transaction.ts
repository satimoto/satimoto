import InvoiceModel from "models/Invoice"
import PaymentModel from "models/Payment"

interface TransactionModel {
    hash: string,
    payment?: PaymentModel
    invoice?: InvoiceModel
}

type TransactionModelLike = TransactionModel | undefined

export default TransactionModel
export type { TransactionModelLike }
