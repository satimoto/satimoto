import { FirebaseMessagingTypes } from "@react-native-firebase/messaging"
import store from "stores/Store"
import { Log } from "utils/logging"
import {
    InvoiceRequestNotification,
    NotificationType,
    SessionInvoiceNotification,
    SessionUpdateNotification,
    TokenAuthorizeNotification
} from "types/notification"

const log = new Log("NotificationService")

type NotificationTypes = InvoiceRequestNotification | SessionInvoiceNotification | SessionUpdateNotification

const notificationMessageHandler = async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    log.debug(`FCM message received: ${store.lightningStore.blockHeight}`)
    log.debug(JSON.stringify(remoteMessage))

    try {
        const notification = remoteMessageToNotification(remoteMessage.data)

        switch (notification.type) {
            case NotificationType.INVOICE_REQUEST:
                await store.invoiceStore.onInvoiceRequestNotification(notification as InvoiceRequestNotification)
                break
            case NotificationType.SESSION_INVOICE:
                await store.sessionStore.onSessionInvoiceNotification(notification as SessionInvoiceNotification)
                break
            case NotificationType.SESSION_UPDATE:
                await store.sessionStore.onSessionUpdateNotification(notification as SessionUpdateNotification)
                break
            case NotificationType.TOKEN_AUTHORIZE:
                await store.sessionStore.onTokenAuthorizeNotification(notification as TokenAuthorizeNotification)
                break
        }
    } catch (error) {
        log.debug(`FCM message not handled`)
    }
}

const remoteMessageToNotification = (data: unknown): NotificationTypes => {
    if (typeof data == "object" && data !== null && "type" in data) {
        const anyData = data as any
        switch (anyData["type"]) {
            case NotificationType.INVOICE_REQUEST:
                return anyData as InvoiceRequestNotification
            case NotificationType.SESSION_INVOICE:
                return anyData as SessionInvoiceNotification
            case NotificationType.SESSION_UPDATE:
                return anyData as SessionUpdateNotification
            case NotificationType.TOKEN_AUTHORIZE:
                return anyData as TokenAuthorizeNotification
        }
    }

    throw new Error("Unknown notification type")
}

export default notificationMessageHandler
