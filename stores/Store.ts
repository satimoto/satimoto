import { action, makeObservable, observable, when } from "mobx"
import { LightningStore } from "./LightningStore"
import { Log } from "utils/logging"

const log = new Log("Store")

export interface IStore {
    ready: boolean

    initialize(): Promise<void>
    setReady(): void
}

export class Store implements IStore {
    ready = false
    lightningStore: LightningStore

    constructor() {
        this.ready = false
        this.lightningStore = new LightningStore(this)

        makeObservable(this, {
            ready: observable,
            setReady: action
        })

        when(
            () => this.lightningStore.hydrated,
            action(() => this.initialize())
        )
    }

    async initialize(): Promise<void> {
        try {
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
