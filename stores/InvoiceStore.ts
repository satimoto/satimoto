import { Hash } from "fast-sha256"
import { LNURLResponse, LNURLWithdrawParams } from "js-lnurl"
import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import InvoiceModel, { InvoiceModelLike } from "models/Invoice"
import InvoiceRequestModel from "models/InvoiceRequest"
import { lnrpc } from "proto/proto"
import AsyncStorage from "@react-native-async-storage/async-storage"
import NetInfo from "@react-native-community/netinfo"
import * as breezSdk from "react-native-breez-sdk"
import { generateSecureRandom } from "react-native-securerandom"
import { StoreInterface, Store } from "stores/Store"
import * as lnd from "services/lnd"
import * as lnUrl from "services/lnUrl"
import { listInvoiceRequests, updateInvoiceRequest } from "services/satimoto"
import { fromBreezInvoice, fromBreezPayment, fromLndInvoice, fromLndInvoiceResponse, InvoiceStatus, toInvoiceStatus } from "types/invoice"
import { LightningBackend } from "types/lightningBackend"
import { InvoiceRequestNotification } from "types/notification"
import { DEBUG } from "utils/build"
import { ONE_HOUR_INTERVAL } from "utils/constants"
import { bytesToBase64, bytesToHex, deepCopy, toMilliSatoshi, toSatoshi } from "utils/conversion"
import { Log } from "utils/logging"
import { doWhileUntil } from "utils/backoff"

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

    addInvoice(addInvoiceProps: AddInvoiceProps): Promise<InvoiceModel>
    findInvoice(hash: string): InvoiceModelLike
    onInvoiceRequestNotification(notification: InvoiceRequestNotification): Promise<void>
    settleInvoice(hash: string): void
    waitForInvoice(hash: string): Promise<InvoiceModel>
    withdrawLnurl(withdrawParams: LNURLWithdrawParams, amountSats: number): Promise<breezSdk.LnUrlCallbackStatus>
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
            actionResetInvoices: action,
            actionSetReady: action,
            actionSubscribeInvoices: action,
            actionSettleInvoice: action,
            actionUpdateAddIndex: action,
            actionUpdateInvoice: action
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
            log.error(`SAT041: Error Initializing: ${error}`, true)
        }
    }

    async addInvoice({ value, valueMsat, memo, createChannel = false }: AddInvoiceProps): Promise<InvoiceModel> {
        if (!value && !valueMsat) {
            throw new Error("No value set")
        }

        value = value || toSatoshi(valueMsat!).toNumber()
        valueMsat = valueMsat || toMilliSatoshi(value!).toNumber()

        if (this.stores.lightningStore.backend === LightningBackend.BREEZ_SDK) {
            const breezInvoice = await breezSdk.receivePayment(value, memo || "")
            log.debug(`Invoice: ${breezInvoice.timestamp} ${breezInvoice.expiry}`)
            const invoice = fromBreezInvoice(breezInvoice)

            return this.actionUpdateInvoice(invoice)
        } else if (this.stores.lightningStore.backend === LightningBackend.LND) {
            const preimage: Uint8Array = await generateSecureRandom(32)
            const paymentAddr: Uint8Array = await generateSecureRandom(32)
            const routeHints: lnrpc.RouteHint[] = []

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

            const lndInvoiceResponse = await lnd.addInvoice({ valueMsat, memo, paymentAddr, preimage, routeHints })
            const paymentRequest = await breezSdk.parseInvoice(lndInvoiceResponse.paymentRequest)
            const invoice = fromLndInvoiceResponse(lndInvoiceResponse, paymentRequest)

            return this.actionUpdateInvoice(invoice)
        }

        throw Error("Not implemented")
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
                    log.error(`SAT042: Error adding invoice: ${error}`, true)
                }
            }
        }
    }

    async onInvoiceRequestNotification(notification: InvoiceRequestNotification): Promise<void> {
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
    }

    reset() {
        this.actionResetInvoices()
    }

    settleInvoice(hash: string) {
        this.actionSettleInvoice(hash)
    }

    async updateBreezInvoices(payments: breezSdk.Payment[]) {
        for (const payment of payments) {
            this.actionUpdateInvoice(fromBreezPayment(payment))
            this.actionUpdateAddIndex(payment.paymentTime.toString())
        }

        this.actionSetReady()
    }

    updateInvoiceRequestTimer(start: boolean) {
        if (start && !this.invoiceRequestUpdateTimer) {
            log.debug(`SAT043 updateInvoiceRequestTimer: start`, true)
            this.fetchInvoiceRequests()
            this.invoiceRequestUpdateTimer = setInterval(this.fetchInvoiceRequests.bind(this), ONE_HOUR_INTERVAL * 1000)
        } else if (!start) {
            log.debug(`SAT044 updateInvoiceRequestTimer: stop`, true)
            clearInterval(this.invoiceRequestUpdateTimer)
            this.invoiceRequestUpdateTimer = null
        }
    }

    waitForInvoice(hash: string): Promise<InvoiceModel> {
        return doWhileUntil("GetInvoice", () => this.findInvoice(hash), 500, 10)
    }

    async withdrawLnurl(withdrawParams: breezSdk.LnUrlWithdrawRequestData, amountSats: number): Promise<breezSdk.LnUrlCallbackStatus> {
        if (this.stores.lightningStore.backend === LightningBackend.BREEZ_SDK) {
            return breezSdk.withdrawLnurl(deepCopy(withdrawParams), amountSats)
        } else if (this.stores.lightningStore.backend === LightningBackend.LND) {
            const invoice = await this.addInvoice({ value: amountSats, createChannel: true })

            return lnUrl.withdrawRequest(withdrawParams.callback, withdrawParams.k1, invoice.paymentRequest)
        }

        throw Error("Not implemented")
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

    actionUpdateInvoice(invoice: InvoiceModel): InvoiceModel {
        let existingInvoice = this.invoices.find(({ hash }) => hash === invoice.hash)

        if (existingInvoice) {
            Object.assign(existingInvoice, invoice)
        } else {
            this.invoices.push(invoice)
        }

        this.stores.transactionStore.addTransaction({ hash: invoice.hash, invoice })

        return invoice
    }

    actionInvoiceReceived(data: lnrpc.Invoice) {
        const hash = bytesToHex(data.rHash)
        log.debug(`SAT045: Update invoice: ${hash}`, true)

        let invoice = this.invoices.find((invoice) => invoice.hash === hash)

        if (invoice) {
            Object.assign(invoice, {
                description: data.memo,
                status: toInvoiceStatus(data.state)
            })
        } else {
            invoice = fromLndInvoice(data)

            this.invoices.push(invoice)
        }

        this.stores.transactionStore.addTransaction({ hash: invoice.hash, invoice })

        // An invoice has settled, update channel store
        if (data.settled) {
            this.stores.channelStore.getChannelBalance()
        }
    }

    actionResetInvoices() {
        this.addIndex = "0"
        this.settleIndex = "0"
        this.invoices.clear()
        this.subscribedInvoices = false
    }

    actionSetReady() {
        this.ready = true
    }

    actionSubscribeInvoices() {
        if (!this.subscribedInvoices) {
            lnd.subscribeInvoices((data: lnrpc.Invoice) => this.actionInvoiceReceived(data), this.addIndex, this.settleIndex)
            this.subscribedInvoices = true
        }
    }

    actionSettleInvoice(hash: string) {
        log.debug(`SAT046: Settle invoice: ${hash}`, true)
        const invoice = this.findInvoice(hash)

        if (invoice) {
            log.debug(`SAT047: Invoice marked settled: ${hash}`, true)
            Object.assign(invoice, {
                status: InvoiceStatus.SETTLED
            })

            this.stores.transactionStore.addTransaction({ hash, invoice })
            this.stores.channelStore.getChannelBalance()
        }
    }

    actionUpdateAddIndex(addIndex?: string) {
        if (addIndex) {
            this.addIndex = addIndex
        }
    }

    async whenSyncedToChain(): Promise<void> {
        if (this.stores.lightningStore.backend === LightningBackend.BREEZ_SDK) {
            const fromTimestamp = this.addIndex !== "0" ? parseInt(this.addIndex) : undefined
            const payments = await breezSdk.listPayments(breezSdk.PaymentTypeFilter.RECEIVED, fromTimestamp)

            this.updateBreezInvoices(payments)
        } else if (this.stores.lightningStore.backend === LightningBackend.LND) {
            this.actionSubscribeInvoices()
        }

        this.updateInvoiceRequestTimer(true)
    }
}
