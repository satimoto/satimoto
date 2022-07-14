import { NotificationMessage } from "./type"
import store from "stores/Store"
import { Log } from "utils/logging"

const log = new Log("SessionNotification")

export const sessionInvoice = async (message: NotificationMessage) => {
    store.paymentStore.sendPayment({paymentRequest: message.paymentRequest})
}
