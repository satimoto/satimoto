import { when } from "mobx"
import { FirebaseMessagingTypes } from "@react-native-firebase/messaging"
import store from "stores/Store"
import {
    DataPingNotification,
    InvoiceRequestNotification,
    NotificationType,
    SessionInvoiceNotification,
    SessionUpdateNotification,
    TokenAuthorizeNotification
} from "types/notification"
import { Log } from "utils/logging"

const log = new Log("NotificationService")

type NotificationTypes = InvoiceRequestNotification | SessionInvoiceNotification | SessionUpdateNotification

const notificationMessageHandler = async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    // Wait for store is ready
    await when(() => store.ready)

    log.debug(`SAT019: FCM message received: ${store.lightningStore.blockHeight}`, true)
    log.debug(JSON.stringify(remoteMessage), true)

    try {
        const notification = remoteMessageToNotification(remoteMessage.data)

        switch (notification.type) {
            case NotificationType.DATA_PING:
                await store.settingStore.onDataPingNotification(notification as DataPingNotification)
                break
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
        log.debug(`SAT020: FCM message not handled`, true)
    }
}

const remoteMessageToNotification = (data: unknown): NotificationTypes => {
    if (typeof data == "object" && data !== null && "type" in data) {
        const anyData = data as any
        switch (anyData["type"]) {
            case NotificationType.DATA_PING:
                return anyData as DataPingNotification
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
