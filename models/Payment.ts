import { BaseTransactionModel } from "models/BaseTransaction";

interface PaymentModel extends BaseTransactionModel {
    feeMsat: string
    feeSat: string
}

type PaymentModelLike = PaymentModel | undefined

export default PaymentModel
export type { PaymentModelLike }
