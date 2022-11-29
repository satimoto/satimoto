import { SessionStatus } from "./session"

export enum NotificationType {
    DATA_PING = "DATA_PING",
    INVOICE_REQUEST = "INVOICE_REQUEST",
    SESSION_INVOICE = "SESSION_INVOICE",
    SESSION_UPDATE = "SESSION_UPDATE",
    TOKEN_AUTHORIZE = "TOKEN_AUTHORIZE"
}

export interface Notification {
    type: NotificationType
}

export interface DataPingNotification extends Notification {}

export interface InvoiceRequestNotification extends Notification {}

export interface SessionInvoiceNotification extends Notification {
    paymentRequest: string
    signature: string
    sessionUid: string
    sessionInvoiceId: number
    status: SessionStatus
    startDatetime: string
}

export interface SessionUpdateNotification extends Notification {
    sessionUid: string
    status: SessionStatus
}

export interface TokenAuthorizeNotification extends Notification {
    authorizationId: string
}
