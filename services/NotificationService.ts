import { sessionInvoice } from "./notification/session"
import { FirebaseMessagingTypes } from "@react-native-firebase/messaging"
import store from "stores/Store"
import { Log } from "utils/logging"
import { SESSION_INVOICE } from "./notification/type"

const log = new Log("NotificationService")

const notificationMessageHandler = async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    log.debug(`FCM message received: ${store.lightningStore.blockHeight}`)
    log.debug(JSON.stringify(remoteMessage))

    if (remoteMessage.data) {
        switch (remoteMessage.data.type) {
            case SESSION_INVOICE:
                await sessionInvoice(remoteMessage.data)
                break;
            default:
                log.debug(`FCM message not handled`)
                break;
        }
    }
}

export default notificationMessageHandler
