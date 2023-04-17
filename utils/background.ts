import BackgroundFetch from "react-native-background-fetch"
import NetInfo from "@react-native-community/netinfo"
import queueFactory from "react-native-queue"
import store, { Store } from "stores/Store"
import { DataPingNotification, InvoiceRequestNotification, SessionInvoiceNotification, SessionUpdateNotification } from "types/notification"
import { Log } from "utils/logging"

const log = new Log("Background")

export const BACKGROUND_FETCH_CONFIG = {
    stopOnTerminate: false,
    enableHeadless: true,
    startOnBoot: true,
    requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY
}

export const addWorkers = (queue: any, store: Store) => {
    queue.addWorker("data-ping-notification", async (id: string, payload: any) => {
        const startTime = log.debugTime(`SAT089: Started work on data-ping-notification id: ${id}`, undefined, true)
        await store.settingStore.workerDataPingNotification(payload as DataPingNotification)
        log.debugTime(`SAT090: Finished work on data-ping-notification id: ${id}`, startTime, true)
    })

    queue.addWorker("invoice-request-notification", async (id: string, payload: any) => {
        const startTime = log.debugTime(`SAT091: Started work on invoice-request-notification id: ${id}`, undefined, true)
        await store.invoiceStore.workerInvoiceRequestNotification(payload as InvoiceRequestNotification)
        log.debugTime(`SAT092: Finished work on invoice-request-notification id: ${id}`, startTime, true)
    })

    queue.addWorker("session-update-worker", async (id: string, payload: any) => {
        const startTime = log.debugTime(`SAT109: Started work on session-update-worker id: ${id}`, undefined, true)
        await store.sessionStore.workerSessionUpdate()
        log.debugTime(`SAT110: Finished work on session-update-worker id: ${id}`, startTime, true)
    })

    queue.addWorker("session-invoice-notification", async (id: string, payload: any) => {
        const startTime = log.debugTime(`SAT093: Started work on session-invoice-notification id: ${id}`, undefined, true)
        await store.sessionStore.workerSessionInvoiceNotification(payload as SessionInvoiceNotification)
        log.debugTime(`SAT094: Finished work on session-invoice-notification id: ${id}`, startTime, true)
    })

    queue.addWorker("session-update-notification", async (id: string, payload: any) => {
        const startTime = log.debugTime(`SAT095: Started work on session-update-notification id: ${id}`, undefined, true)
        await store.sessionStore.workerSessionUpdateNotification(payload as SessionUpdateNotification)
        log.debugTime(`SAT096: Finished work on session-update-notification id: ${id}`, startTime, true)
    })
}

export const backgroundEvent = async (taskId: string) => {
    const startTime = log.debugTime(`SAT097: Background event started`, undefined, true)

    const netState = await NetInfo.fetch()
    log.debug(`SAT097: Background net connected: ${netState.isConnected} reachable: ${netState.isInternetReachable}`, true)

    if (netState.isConnected) {
        const queue = await queueFactory()

        addWorkers(store.queue, store)

        await store.startQueue(30000)
    }

    BackgroundFetch.finish(taskId)
    log.debugTime(`SAT098: Background event finished`, startTime, true)
}

export const backgroundTimeout = async (taskId: string) => {
    log.debug(`SAT099: Background event timeout`, true)

    BackgroundFetch.finish(taskId)
}
