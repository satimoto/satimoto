import { InvoiceStatus } from "types/invoice"

interface InvoiceModel {
    createdAt: string
    description: string
    hash: string
    status: InvoiceStatus
    valueMsat: string
    valueSat: string
}

type InvoiceModelLike = InvoiceModel | undefined

export default InvoiceModel
export type { InvoiceModelLike }
