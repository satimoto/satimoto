import { Hash } from "fast-sha256"
import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import InvoiceModel, { InvoiceModelLike } from "models/Invoice"
import moment from "moment"
import { lnrpc } from "proto/proto"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { generateSecureRandom } from "react-native-securerandom"
import { createChannelRequest } from "services/SatimotoService"
import { StoreInterface, Store } from "stores/Store"
import { addInvoice, subscribeInvoices } from "services/LightningService"
import { InvoiceStatus, toInvoiceStatus } from "types/invoice"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"
import { bytesToBase64, bytesToHex, secondsToDate, toLong, toMilliSatoshi, toNumber } from "utils/conversion"
import { randomLong } from "utils/random"
import { doWhileUntil } from "utils/tools"

const log = new Log("InvoiceStore")

export interface InvoiceStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    addIndex: string
    settleIndex: string
    invoices: InvoiceModel[]
    subscribedInvoices: boolean

    addInvoice(amount: number): Promise<lnrpc.AddInvoiceResponse>
    findInvoice(hash: string): InvoiceModelLike
    settleInvoice(hash: string): void
    waitForInvoice(hash: string): Promise<InvoiceModel>
}

export class InvoiceStore implements InvoiceStoreInterface {
    // Store state
    hydrated = false
    ready = false
    stores

    addIndex = "0"
    settleIndex = "0"
    invoices
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

            setReady: action,
            settleInvoice: action,
            subscribeInvoices: action,
            onInvoice: action
        })

        makePersistable(
            this,
            { name: "InvoiceStore", properties: ["addIndex", "settleIndex"], storage: AsyncStorage, debugMode: DEBUG },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    async initialize(): Promise<void> {
        try {
            // When the synced to chain, subscribe to transactions
            when(
                () => this.stores.lightningStore.syncedToChain,
                () => this.subscribeInvoices()
            )
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    async addInvoice(amount: number) {
        const preimage: Uint8Array = await generateSecureRandom(32)
        const paymentAddr: Uint8Array = await generateSecureRandom(32)
        const routeHints: lnrpc.RouteHint[] = []

        if (this.stores.channelStore.remoteBalance < amount) {
            const paymentHash = new Hash().update(preimage).digest()
            const hopHint = await this.stores.channelStore.createChannelRequest({
                paymentAddr: bytesToBase64(paymentAddr),
                paymentHash: bytesToBase64(paymentHash),
                amountMsat: toMilliSatoshi(amount).toString(10)
            })

            routeHints.push(
                lnrpc.RouteHint.create({
                    hopHints: [hopHint]
                })
            )
        }

        const invoice = await addInvoice({ amt: +amount, paymentAddr, preimage, routeHints })
        return invoice
    }

    findInvoice(hash: string): InvoiceModelLike {
        return this.invoices.find((invoice) => invoice.hash === hash)
    }

    onInvoice(data: lnrpc.Invoice) {
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

    settleInvoice(hash: string) {
        log.debug(`Settle invoice: ${hash}`)
        const invoice = this.findInvoice(hash)

        if (invoice) {
            log.debug(`Invoice marked settled: ${hash}`)
            invoice.status = InvoiceStatus.SETTLED
            this.stores.transactionStore.addTransaction({ hash, invoice })
        }
    }

    subscribeInvoices() {
        if (!this.subscribedInvoices) {
            subscribeInvoices((data: lnrpc.Invoice) => this.onInvoice(data), this.addIndex, this.settleIndex)
            this.subscribedInvoices = true
        }
    }

    setReady() {
        this.ready = true
    }

    waitForInvoice(hash: string): Promise<InvoiceModel> {
        return doWhileUntil("GetInvoice", () => this.findInvoice(hash), 500, 10)
    }
}
