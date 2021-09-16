import { LightningStore } from "./LightningStore"

export interface IStore {
    lightningStore: LightningStore
}

class Store implements IStore {
    lightningStore: LightningStore

    constructor() {
        this.lightningStore = new LightningStore(this)
    }
}

export const store = new Store()
