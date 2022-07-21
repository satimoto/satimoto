import { FirebaseMessagingTypes } from "@react-native-firebase/messaging"
import store from "stores/Store"
import { Log } from "utils/logging"
import { NotificationType, SessionInvoiceNotification, SessionUpdateNotification } from "types/notification"

const log = new Log("NotificationService")

const notificationMessageHandler = async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    log.debug(`FCM message received: ${store.lightningStore.blockHeight}`)
    log.debug(JSON.stringify(remoteMessage))

    try {
        const notification = remoteMessageToNotification(remoteMessage.data)

        switch (notification.type) {
            case NotificationType.SESSION_INVOICE:
                await store.sessionStore.handleSessionInvoiceNotification(notification as SessionInvoiceNotification)
                break
            case NotificationType.SESSION_UPDATE:
                await store.sessionStore.handleSessionUpdateNotification(notification as SessionUpdateNotification)
                break
        }
    } catch (error) {
        log.debug(`FCM message not handled`)
    }
}

const remoteMessageToNotification = (data: unknown): SessionInvoiceNotification | SessionUpdateNotification => {
    if (typeof data == "object" && data !== null && "type" in data) {
        const anyData = data as any
        switch (anyData["type"]) {
            case NotificationType.SESSION_INVOICE:
                return anyData as SessionInvoiceNotification
            case NotificationType.SESSION_UPDATE:
                return anyData as SessionUpdateNotification
        }
    }

    throw new Error("Unknown notification type")
}

export default notificationMessageHandler
