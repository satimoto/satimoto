import { action, makeObservable, observable, when } from "mobx"
import { InvoiceStore } from "./InvoiceStore"
import { LightningStore } from "./LightningStore"
import { PaymentStore } from "./PaymentStore"
import { TransactionStore } from "./TransactionStore"
import { WalletStore } from "./WalletStore"
import { Log } from "utils/logging"

const log = new Log("Store")

export interface IStore {
    ready: boolean

    initialize(): Promise<void>
    setReady(): void
}

export class Store implements IStore {
    ready = false
    invoiceStore: InvoiceStore
    lightningStore: LightningStore
    paymentStore: PaymentStore
    transactionStore: TransactionStore
    walletStore: WalletStore

    constructor() {
        this.ready = false
        this.invoiceStore = new InvoiceStore(this)
        this.lightningStore = new LightningStore(this)
        this.paymentStore = new PaymentStore(this)
        this.transactionStore = new TransactionStore(this)
        this.walletStore = new WalletStore(this)

        makeObservable(this, {
            ready: observable,
            setReady: action
        })

        when(
            () =>
                this.invoiceStore.hydrated &&
                this.lightningStore.hydrated &&
                this.paymentStore.hydrated &&
                this.transactionStore.hydrated &&
                this.walletStore.hydrated,
            action(() => this.initialize())
        )
    }

    async initialize(): Promise<void> {
        try {
            await this.invoiceStore.initialize()
            await this.paymentStore.initialize()
            await this.transactionStore.initialize()
            await this.walletStore.initialize()
            await this.lightningStore.initialize()
            this.setReady()
        } catch (error) {
            log.debug(error)
        }
    }

    setReady() {
        this.ready = true
    }
}

export const store = new Store()
