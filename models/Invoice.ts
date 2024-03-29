import { InvoiceStatus } from "types/invoice"

interface InvoiceModel {
    createdAt: string
    expiresAt: string
    description: string
    hash: string
    preimage: string
    paymentRequest: string
    status: InvoiceStatus
    failureReasonKey?: string
    valueMsat: string
    valueSat: string
}

type InvoiceModelLike = InvoiceModel | undefined

export default InvoiceModel
export type { InvoiceModelLike }
