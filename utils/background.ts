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
        const startTime = log.debugTime(`Started work on data-ping id: ${id}`)
        await store.settingStore.workerDataPingNotification(payload as DataPingNotification)
        log.debugTime(`Finished work on data-ping id: ${id}`, startTime)
    })

    queue.addWorker("invoice-request-notification", async (id: string, payload: any) => {
        const startTime = log.debugTime(`Started work on invoice-request id: ${id}`)
        await store.invoiceStore.workerInvoiceRequestNotification(payload as InvoiceRequestNotification)
        log.debugTime(`Finished work on invoice-request id: ${id}`, startTime)
    })

    queue.addWorker("session-invoice-notification", async (id: string, payload: any) => {
        const startTime = log.debugTime(`Started work on session-invoice id: ${id}`)
        await store.sessionStore.workerSessionInvoiceNotification(payload as SessionInvoiceNotification)
        log.debugTime(`Finished work on session-invoice id: ${id}`, startTime)
    })

    queue.addWorker("session-update-notification", async (id: string, payload: any) => {
        const startTime = log.debugTime(`Started work on session-update id: ${id}`)
        await store.sessionStore.workerSessionUpdateNotification(payload as SessionUpdateNotification)
        log.debugTime(`Finished work on session-update id: ${id}`, startTime)
    })
}

export const backgroundEvent = async (taskId: string) => {
    const startTime = log.debugTime(`Background event started`)

    const netState = await NetInfo.fetch()
    log.debugTime(`Background net connected: ${netState.isConnected} reachable: ${netState.isInternetReachable}`)

    if (netState.isConnected) {
        const queue = await queueFactory()

        addWorkers(queue, store)

        await queue.start(30000)
    }

    BackgroundFetch.finish(taskId)
    log.debugTime(`Background event finished`, startTime)
}

export const backgroundTimeout = async (taskId: string) => {
    log.debug(`Background event timeout`)

    BackgroundFetch.finish(taskId)
}
