import { SessionStatus } from "./session"

export enum NotificationType {
    INVOICE_REQUEST = "INVOICE_REQUEST",
    SESSION_INVOICE = "SESSION_INVOICE",
    SESSION_UPDATE = "SESSION_UPDATE",
    TOKEN_AUTHORIZE = "TOKEN_AUTHORIZE"
}

export interface InvoiceRequestNotification {
    type: NotificationType
}

export interface SessionInvoiceNotification {
    type: NotificationType
    paymentRequest: string
    signature: string
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

export interface TokenAuthorizeNotification {
    type: NotificationType
    authorizationId: string
}
