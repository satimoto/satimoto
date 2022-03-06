import { Hash } from "fast-sha256"
import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { lnrpc } from "proto/proto"
import { IStore, Store } from "stores/Store"
import { addInvoice, subscribeInvoices } from "services/LightningService"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"
import { generateSecureRandom } from "react-native-securerandom"
import { createChannelRequest } from "services/SatimotoService"
import { CUSTOMMESSAGE_CHANNELREQUEST_RECEIVE_CHAN_ID, CUSTOMMESSAGE_CHANNELREQUEST_SEND_PREIMAGE } from "utils/constants"
import { bytesToBase64, bytesToHex, toMilliSatoshi, toString } from "utils/conversion"
import { randomLong } from "utils/random"

const log = new Log("InvoiceStore")

export interface IInvoiceStore extends IStore {
    hydrated: boolean
    stores: Store

    subscribedInvoices: boolean

    addInvoice(amount: number): Promise<lnrpc.AddInvoiceResponse>
}

export class InvoiceStore implements IInvoiceStore {
    // Store state
    hydrated = false
    ready = false
    stores

    subscribedInvoices = false

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            subscribedInvoices: observable,

            setReady: action
        })

        makePersistable(this, { name: "InvoiceStore", properties: [], storage: AsyncStorage, debugMode: DEBUG }, { delay: 1000 }).then(
            action((persistStore) => (this.hydrated = persistStore.isHydrated))
        )
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
        const paymentHash = new Hash().update(preimage).digest()
        const paymentAddr: Uint8Array = await generateSecureRandom(32)
        const routeHints: lnrpc.RouteHint[] = []

        if (this.stores.channelStore.remoteBalance < amount) {
            const channelRequest = await createChannelRequest({
                paymentAddr: bytesToBase64(paymentAddr),
                paymentHash: bytesToBase64(paymentHash),
                amountMsat: toMilliSatoshi(amount).toString(10)
            })
            const node = channelRequest.data.createChannelRequest.node
            const peer = await this.stores.peerStore.connectPeer(node.pubkey, node.addr)
            const chanId = randomLong()

            routeHints.push(lnrpc.RouteHint.create({
                hopHints: [
                    {
                        nodeId: peer.pubkey,
                        chanId: chanId,
                    }
                ]
            }))

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
        }

        const invoice = await addInvoice({ amt: +amount, paymentAddr, preimage, routeHints })
        return invoice
    }

    subscribeInvoices() {
        if (!this.subscribedInvoices) {
            subscribeInvoices((data: lnrpc.Invoice) => this.updateInvoices(data))
            this.subscribedInvoices = true
        }
    }

    setReady() {
        this.ready = true
    }

    updateInvoices(data: lnrpc.Invoice) {}
}
