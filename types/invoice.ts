import { lnrpc } from "proto/proto"

export enum InvoiceStatus {
    OPEN = "OPEN",
    SETTLED = "SETTLED",
    CANCELLED = "CANCELLED",
    ACCEPTED = "ACCEPTED"
}

const toInvoiceStatus = (state: lnrpc.Invoice.InvoiceState): InvoiceStatus => {
    switch (state) {
        case lnrpc.Invoice.InvoiceState.ACCEPTED:
            return InvoiceStatus.ACCEPTED
        case lnrpc.Invoice.InvoiceState.CANCELED:
            return InvoiceStatus.CANCELLED
        case lnrpc.Invoice.InvoiceState.SETTLED:
            return InvoiceStatus.SETTLED
    }

    return InvoiceStatus.OPEN
}

export { toInvoiceStatus }