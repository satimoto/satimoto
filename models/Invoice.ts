import { InvoiceStatus } from "types/invoice"

interface InvoiceModel {
    createdAt: string
    expiresAt: string
    description: string
    hash: string
    paymentRequest: string
    status: InvoiceStatus
    valueMsat: string
    valueSat: string
}

type InvoiceModelLike = InvoiceModel | undefined

export default InvoiceModel
export type { InvoiceModelLike }
