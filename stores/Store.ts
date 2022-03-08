import { action, makeObservable, observable, when } from "mobx"
import "reflect-metadata"
import { ChannelStore } from "./ChannelStore"
import { InvoiceStore } from "./InvoiceStore"
import { LightningStore } from "./LightningStore"
import { PaymentStore } from "./PaymentStore"
import { PeerStore } from "./PeerStore"
import { SettingStore } from "./SettingStore"
import { TransactionStore } from "./TransactionStore"
import { WalletStore } from "./WalletStore"
import { Log } from "utils/logging"

const log = new Log("Store")

export interface StoreInterface {
    ready: boolean

    initialize(): Promise<void>
    setReady(): void
}

export class Store implements StoreInterface {
    ready = false
    channelStore: ChannelStore
    invoiceStore: InvoiceStore
    lightningStore: LightningStore
    paymentStore: PaymentStore
    peerStore: PeerStore
    settingStore: SettingStore
    transactionStore: TransactionStore
    walletStore: WalletStore

    constructor() {
        this.ready = false
        this.channelStore = new ChannelStore(this)
        this.invoiceStore = new InvoiceStore(this)
        this.lightningStore = new LightningStore(this)
        this.paymentStore = new PaymentStore(this)
        this.peerStore = new PeerStore(this)
        this.settingStore = new SettingStore(this)
        this.transactionStore = new TransactionStore(this)
        this.walletStore = new WalletStore(this)

        makeObservable(this, {
            ready: observable,
            setReady: action
        })

        when(
            () =>
                this.channelStore.hydrated &&
                this.invoiceStore.hydrated &&
                this.lightningStore.hydrated &&
                this.paymentStore.hydrated &&
                this.peerStore.hydrated &&
                this.settingStore.hydrated &&
                this.transactionStore.hydrated &&
                this.walletStore.hydrated,
            action(() => this.initialize())
        )
    }

    async initialize(): Promise<void> {
        try {
            await this.channelStore.initialize()
            await this.invoiceStore.initialize()
            await this.paymentStore.initialize()
            await this.peerStore.initialize()
            await this.settingStore.initialize()
            await this.transactionStore.initialize()
            await this.walletStore.initialize()
            await this.lightningStore.initialize()
            this.setReady()
        } catch (error) {
            log.error(JSON.stringify(error, undefined, 2))
        }
    }

    setReady() {
        this.ready = true
    }
}

const store = new Store()

export default store
