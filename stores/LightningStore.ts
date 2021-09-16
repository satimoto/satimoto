import { action, makeObservable, observable } from "mobx"
import { IStore } from "./Store"
import { getInfo } from "services/LightningService"

export interface ILightningStore {
    ready: boolean
    stores: IStore

    initialize(): void
    updateChannels(): void
}

export class LightningStore implements ILightningStore {
    ready = false
    stores

    constructor(stores: IStore) {
        this.stores = stores

        makeObservable(this, {
            ready: observable,
            initialize: action,
            updateChannels: action
        })

    }

    initialize() {}
    updateChannels() {}
}
