import { Hash } from "fast-sha256"
import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import InvoiceModel, { InvoiceModelLike } from "models/Invoice"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { lnrpc } from "proto/proto"
import { StoreInterface, Store } from "stores/Store"
import { addInvoice, subscribeInvoices } from "services/LightningService"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"
import { generateSecureRandom } from "react-native-securerandom"
import { createChannelRequest } from "services/SatimotoService"
import { CUSTOMMESSAGE_CHANNELREQUEST_RECEIVE_CHAN_ID, CUSTOMMESSAGE_CHANNELREQUEST_SEND_PREIMAGE } from "utils/constants"
import { bytesToBase64, bytesToHex, secondsToDate, toMilliSatoshi, toSatoshi } from "utils/conversion"
import { randomLong } from "utils/random"
import { InvoiceStatus, toInvoiceStatus } from "types/invoice"

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
            updateInvoice: action
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

            const channelRequest = await createChannelRequest({
                paymentAddr: bytesToBase64(paymentAddr),
                paymentHash: bytesToBase64(paymentHash),
                amountMsat: toMilliSatoshi(amount).toString(10)
            })
            const node = channelRequest.data.createChannelRequest.node
            const peer = await this.stores.peerStore.connectPeer(node.pubkey, node.addr)
            const chanId = randomLong()

            routeHints.push(
                lnrpc.RouteHint.create({
                    hopHints: [
                        {
                            nodeId: peer.pubkey,
                            chanId: chanId
                        }
                    ]
                })
            )

            this.stores.peerStore.addCustomMessageResponder({
                request: {
                    peer: node.pubkey,
                    type: CUSTOMMESSAGE_CHANNELREQUEST_RECEIVE_CHAN_ID,
                    data: chanId.toString(10)
                },
                response: {
                    peer: node.pubkey,
                    type: CUSTOMMESSAGE_CHANNELREQUEST_SEND_PREIMAGE,
                    data: bytesToHex(preimage)
                }
            })

            this.stores.channelStore.addChannelRequest(node.pubkey, bytesToHex(paymentHash), amount.toString())
        }

        const invoice = await addInvoice({ amt: +amount, paymentAddr, preimage, routeHints })
        return invoice
    }

    findInvoice(hash: string): InvoiceModelLike {
        return this.invoices.find((invoice) => invoice.hash === hash)
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
            subscribeInvoices((data: lnrpc.Invoice) => this.updateInvoice(data), this.addIndex, this.settleIndex)
            this.subscribedInvoices = true
        }
    }

    setReady() {
        this.ready = true
    }

    updateInvoice(data: lnrpc.Invoice) {
        const hash = bytesToHex(data.rHash)
        log.debug(`Update invoice: ${hash}`)

        let invoice = this.invoices.find((invoice) => invoice.hash === hash)

        if (invoice) {
            Object.assign(invoice, {
                description: data.memo,
                status: toInvoiceStatus(data.state)
            })
        } else {
            invoice = {
                createdAt: secondsToDate(data.creationDate).toISOString(),
                description: data.memo,
                hash,
                status: toInvoiceStatus(data.state),
                valueMsat: data.valueMsat.toString(),
                valueSat: data.value.toString(),
            }

            this.invoices.push(invoice)
        }

        this.stores.transactionStore.addTransaction({ hash: invoice.hash, invoice })

        // An invoice has settled, update channel store
        if (data.settled) {
            this.stores.channelStore.getChannelBalance()
        }
    }
}
