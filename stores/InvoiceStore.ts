import { Hash } from "fast-sha256"
import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import InvoiceModel, { InvoiceModelLike } from "models/Invoice"
import InvoiceRequestModel from "models/InvoiceRequest"
import moment from "moment"
import { lnrpc } from "proto/proto"
import AsyncStorage from "@react-native-async-storage/async-storage"
import NetInfo from "@react-native-community/netinfo"
import { generateSecureRandom } from "react-native-securerandom"
import { StoreInterface, Store } from "stores/Store"
import { addInvoice, subscribeInvoices } from "services/LightningService"
import { listInvoiceRequests, updateInvoiceRequest } from "services/SatimotoService"
import { InvoiceStatus, toInvoiceStatus } from "types/invoice"
import { InvoiceRequestNotification } from "types/notification"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"
import { INVOICE_REQUEST_UPDATE_INTERVAL } from "utils/constants"
import { bytesToBase64, bytesToHex, secondsToDate, toMilliSatoshi, toNumber, toSatoshi } from "utils/conversion"
import { doWhileUntil } from "utils/tools"

const log = new Log("InvoiceStore")

interface AddInvoiceProps {
    value?: number
    valueMsat?: number
    memo?: string
    createChannel?: boolean
}

export interface InvoiceStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    addIndex: string
    settleIndex: string
    invoices: InvoiceModel[]
    subscribedInvoices: boolean

    addInvoice(addInvoiceProps: AddInvoiceProps): Promise<lnrpc.AddInvoiceResponse>
    findInvoice(hash: string): InvoiceModelLike
    onInvoiceRequestNotification(notification: InvoiceRequestNotification): Promise<void>
    settleInvoice(hash: string): void
    waitForInvoice(hash: string): Promise<InvoiceModel>
}

export class InvoiceStore implements InvoiceStoreInterface {
    // Store state
    hydrated = false
    ready = false
    queue: any = undefined
    stores

    addIndex = "0"
    settleIndex = "0"
    invoices
    invoiceRequestUpdateTimer: any = undefined
    subscribedInvoices = false

    constructor(stores: Store) {
        this.stores = stores
        this.invoices = observable<InvoiceModel>([])

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            addIndex: observable,
            settleIndex: observable,
            invoices: observable,
            subscribedInvoices: observable,

            actionInvoiceReceived: action,
            actionSetReady: action,
            actionSubscribeInvoices: action,
            actionSettleInvoice: action
        })

        makePersistable(
            this,
            { name: "InvoiceStore", properties: ["addIndex", "settleIndex"], storage: AsyncStorage, debugMode: DEBUG },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    async initialize(): Promise<void> {
        this.queue = this.stores.queue

        try {
            // When the synced to chain, subscribe to transactions
            when(
                () => this.stores.lightningStore.syncedToChain,
                () => this.whenSyncedToChain()
            )
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    async addInvoice({ value, valueMsat, memo, createChannel = false }: AddInvoiceProps) {
        const preimage: Uint8Array = await generateSecureRandom(32)
        const paymentAddr: Uint8Array = await generateSecureRandom(32)
        const routeHints: lnrpc.RouteHint[] = []

        if (!value && !valueMsat) {
            throw new Error("No value set")
        }

        value = value || toSatoshi(valueMsat!).toNumber()
        valueMsat = valueMsat || toMilliSatoshi(value!).toNumber()

        if (this.stores.channelStore.remoteBalance < value) {
            if (createChannel) {
                const paymentHash = new Hash().update(preimage).digest()
                const hopHint = await this.stores.channelStore.createChannelRequest({
                    paymentAddr: bytesToBase64(paymentAddr),
                    paymentHash: bytesToBase64(paymentHash),
                    amountMsat: valueMsat.toString(10)
                })

                routeHints.push(
                    lnrpc.RouteHint.create({
                        hopHints: [hopHint]
                    })
                )
            } else {
                throw new Error("Insufficient funds")
            }
        }

        const invoice = await addInvoice({ valueMsat, memo, paymentAddr, preimage, routeHints })
        return invoice
    }

    findInvoice(hash: string): InvoiceModelLike {
        return this.invoices.find((invoice) => invoice.hash === hash)
    }

    async fetchInvoiceRequests(): Promise<void> {
        if (this.stores.settingStore.accessToken) {
            const response = await listInvoiceRequests()
            const invoiceRequests = response.data.listInvoiceRequests as InvoiceRequestModel[]

            // Wait for synced to chain
            await when(() => this.stores.lightningStore.syncedToChain)

            for (const invoiceRequest of invoiceRequests) {
                try {
                    const invoice = await this.addInvoice({ valueMsat: invoiceRequest.totalMsat, memo: invoiceRequest.memo })

                    await updateInvoiceRequest({ id: invoiceRequest.id, paymentRequest: invoice.paymentRequest })
                } catch (error) {
                    log.error(`Error adding invoice: ${error}`)
                }
            }
        }
    }

    async onInvoiceRequestNotification(notification: InvoiceRequestNotification): Promise<void> {
        if (this.stores.uiStore.appState === "background") {
            const netState = await NetInfo.fetch()

            this.queue.createJob(
                "invoice-request-notification",
                notification,
                {
                    attempts: 3,
                    timeout: 20000
                },
                netState.isConnected && netState.isInternetReachable
            )
        } else {
            await this.workerInvoiceRequestNotification(notification)
        }
    }

    settleInvoice(hash: string) {
        this.actionSettleInvoice(hash)
    }

    startInvoiceRequestUpdates() {
        log.debug(`startInvoiceRequestUpdates`)

        if (!this.invoiceRequestUpdateTimer) {
            this.fetchInvoiceRequests()
            this.invoiceRequestUpdateTimer = setInterval(this.fetchInvoiceRequests.bind(this), INVOICE_REQUEST_UPDATE_INTERVAL * 1000)
        }
    }

    stopInvoiceRequestUpdates() {
        log.debug(`stopInvoiceRequestUpdates`)
        clearInterval(this.invoiceRequestUpdateTimer)
        this.invoiceRequestUpdateTimer = null
    }

    waitForInvoice(hash: string): Promise<InvoiceModel> {
        return doWhileUntil("GetInvoice", () => this.findInvoice(hash), 500, 10)
    }

    /*
     * Queue workers
     */

    async workerInvoiceRequestNotification(notification: InvoiceRequestNotification): Promise<void> {
        await this.fetchInvoiceRequests()
    }

    /*
     * Mobx actions and reactions
     */

    actionInvoiceReceived(data: lnrpc.Invoice) {
        const hash = bytesToHex(data.rHash)
        log.debug(`Update invoice: ${hash}`)

        let invoice = this.invoices.find((invoice) => invoice.hash === hash)

        if (invoice) {
            Object.assign(invoice, {
                description: data.memo,
                status: toInvoiceStatus(data.state)
            })
        } else {
            const createdAt = secondsToDate(data.creationDate)
            invoice = {
                createdAt: createdAt.toISOString(),
                expiresAt: moment(createdAt).add(toNumber(data.expiry), "second").toISOString(),
                description: data.memo,
                hash,
                preimage: bytesToHex(data.rPreimage),
                paymentRequest: data.paymentRequest,
                status: toInvoiceStatus(data.state),
                valueMsat: data.valueMsat.toString(),
                valueSat: data.value.toString()
            }

            this.invoices.push(invoice)
        }

        this.stores.transactionStore.addTransaction({ hash: invoice.hash, invoice })

        // An invoice has settled, update channel store
        if (data.settled) {
            this.stores.channelStore.getChannelBalance()
        }
    }

    actionSetReady() {
        this.ready = true
    }

    actionSubscribeInvoices() {
        if (!this.subscribedInvoices) {
            subscribeInvoices((data: lnrpc.Invoice) => this.actionInvoiceReceived(data), this.addIndex, this.settleIndex)
            this.subscribedInvoices = true
        }
    }

    actionSettleInvoice(hash: string) {
        log.debug(`Settle invoice: ${hash}`)
        const invoice = this.findInvoice(hash)

        if (invoice) {
            log.debug(`Invoice marked settled: ${hash}`)
            invoice.status = InvoiceStatus.SETTLED
            this.stores.transactionStore.addTransaction({ hash, invoice })
        }
    }

    async whenSyncedToChain(): Promise<void> {
        this.actionSubscribeInvoices()
        this.startInvoiceRequestUpdates()
    }
}
