import { action, makeObservable, observable } from "mobx"
import { makePersistable } from "mobx-persist-store"
import SessionModel from "models/Session"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { StoreInterface, Store } from "stores/Store"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"

const log = new Log("SessionStore")

export interface SessionStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    sessions: SessionModel[]
}

export class SessionStore implements SessionStoreInterface {
    hydrated = false
    ready = false
    stores

    sessions

    constructor(stores: Store) {
        this.stores = stores
        this.sessions = observable<SessionModel>([])

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            sessions: observable,

            setReady: action
        })

        makePersistable(this, { name: "SessionStore", properties: [], storage: AsyncStorage, debugMode: DEBUG }, { delay: 1000 }).then(
            action((persistStore) => (this.hydrated = persistStore.isHydrated))
        )
    }

    async initialize(): Promise<void> {
        try {
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    setReady() {
        this.ready = true
    }
}
