import { action, makeObservable, observable, reaction, when } from "mobx"
import "reflect-metadata"
import queueFactory from "react-native-queue"
import { ChannelStore } from "./ChannelStore"
import { InvoiceStore } from "./InvoiceStore"
import { LightningStore } from "./LightningStore"
import { LocationStore } from "./LocationStore"
import { PaymentStore } from "./PaymentStore"
import { PeerStore } from "./PeerStore"
import { SessionStore } from "./SessionStore"
import { SettingStore } from "./SettingStore"
import { TransactionStore } from "./TransactionStore"
import { UiStore } from "./UiStore"
import { WalletStore } from "./WalletStore"
import { addWorkers } from "utils/background"
import { Log } from "utils/logging"

const log = new Log("Store")

export interface StoreInterface {
    ready: boolean

    initialize(): Promise<void>
    actionSetReady(): void
}

export class Store implements StoreInterface {
    ready = false
    queue: any = undefined

    channelStore: ChannelStore
    invoiceStore: InvoiceStore
    lightningStore: LightningStore
    locationStore: LocationStore
    paymentStore: PaymentStore
    peerStore: PeerStore
    settingStore: SettingStore
    sessionStore: SessionStore
    transactionStore: TransactionStore
    uiStore: UiStore
    walletStore: WalletStore

    constructor() {
        this.ready = false
        this.channelStore = new ChannelStore(this)
        this.invoiceStore = new InvoiceStore(this)
        this.lightningStore = new LightningStore(this)
        this.locationStore = new LocationStore(this)
        this.paymentStore = new PaymentStore(this)
        this.peerStore = new PeerStore(this)
        this.sessionStore = new SessionStore(this)
        this.settingStore = new SettingStore(this)
        this.transactionStore = new TransactionStore(this)
        this.uiStore = new UiStore(this)
        this.walletStore = new WalletStore(this)

        makeObservable(this, {
            ready: observable,
            actionSetReady: action
        })

        when(
            () =>
                this.channelStore.hydrated &&
                this.invoiceStore.hydrated &&
                this.lightningStore.hydrated &&
                this.locationStore.hydrated &&
                this.paymentStore.hydrated &&
                this.peerStore.hydrated &&
                this.sessionStore.hydrated &&
                this.settingStore.hydrated &&
                this.transactionStore.hydrated &&
                this.transactionStore.hydrated &&
                this.walletStore.hydrated,
            action(() => this.initialize())
        )
    }

    async initialize(): Promise<void> {
        try {
            this.queue = await queueFactory()

            await this.channelStore.initialize()
            await this.invoiceStore.initialize()
            await this.paymentStore.initialize()
            await this.peerStore.initialize()
            await this.sessionStore.initialize()
            await this.settingStore.initialize()
            await this.transactionStore.initialize()
            await this.uiStore.initialize()
            await this.walletStore.initialize()
            await this.lightningStore.initialize()
            await this.locationStore.initialize()

            reaction(
                () => [this.uiStore.appState],
                () => this.reactionAppState()
            )

            reaction(
                () => [this.channelStore.lastActiveTimestamp],
                () => this.reactionLastActiveTimestamp()
            )

            addWorkers(this.queue, this)
            this.actionSetReady()
        } catch (error) {
            log.error(`SAT078: Error Initializing`, true)
            log.error(JSON.stringify(error, undefined, 2))
        }
    }

    async startQueue(lifespan?: number): Promise<void> {
        await this.queue.start(lifespan)
        await this.sessionStore.enqueueJobs()
    }

    /*
     * Mobx actions and reactions
     */

    actionSetReady() {
        this.ready = true
    }

    async reactionAppState() {
        if (this.uiStore.appState === "active") {
            const startTime = log.debugTime(`SAT079: Foreground queue started`, undefined, true)

            await this.startQueue()
            log.debugTime(`SAT080: Foreground queue finished`, startTime, true)
        }
    }

    async reactionLastActiveTimestamp() {
        const startTime = log.debugTime(`SAT081: ActiveChannel queue started`, undefined, true)

        await this.startQueue()
        log.debugTime(`SAT082: ActiveChannel queue finished`, startTime, true)
    }
}

const store = new Store()

export default store
