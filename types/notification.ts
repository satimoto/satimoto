import { SessionStatus } from "./session"

export enum NotificationType {
    INVOICE_REQUEST = "INVOICE_REQUEST",
    SESSION_INVOICE = "SESSION_INVOICE",
    SESSION_UPDATE = "SESSION_UPDATE"
}

export interface InvoiceRequestNotification {
    type: NotificationType
}

export interface SessionInvoiceNotification {
    type: NotificationType
    paymentRequest: string
    sessionUid: string
    sessionInvoiceId: number
    status: SessionStatus
    startDatetime: string
}

export interface SessionUpdateNotification {
    type: NotificationType
    sessionUid: string
    status: SessionStatus
}
