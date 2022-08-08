import { PaymentStatus } from "types/payment"

interface PaymentModel {
    createdAt: string
    expiresAt: string
    description: string
    hash: string
    preimage?: string
    status: PaymentStatus
    valueMsat: string
    valueSat: string
    feeMsat: string
    feeSat: string
}

type PaymentModelLike = PaymentModel | undefined

export default PaymentModel
export type { PaymentModelLike }
