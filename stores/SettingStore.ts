import { action, makeObservable, observable } from "mobx"
import { makePersistable } from "mobx-persist-store"
import AsyncStorage from "@react-native-async-storage/async-storage"
import messaging from "@react-native-firebase/messaging"
import { IStore, Store } from "stores/Store"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"

const log = new Log("SettingStore")

export interface ISettingStore extends IStore {
    hydrated: boolean
    stores: Store

    pushNotificationEnabled: boolean
    pushNotificationToken: string

    requestPushNotificationPermission(): void
}

export class SettingStore implements ISettingStore {
    hydrated = false
    ready = false
    stores

    pushNotificationEnabled = false
    pushNotificationToken = ""

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,
            pushNotificationEnabled: observable,
            pushNotificationToken: observable,

            updatePushNotificationSettings: action
        })

        makePersistable(
            this,
            { name: "SettingStore", properties: ["pushNotificationEnabled", "pushNotificationToken"], storage: AsyncStorage, debugMode: DEBUG },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    async initialize(): Promise<void> {
        this.setReady()
    }

    setReady() {
        this.ready = true
    }

    async requestPushNotificationPermission() {
        const authStatus = await messaging().requestPermission()
        const token = await messaging().getToken()

        const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL
        this.updatePushNotificationSettings(enabled, token)

        messaging().onTokenRefresh((token) => {
            this.updatePushNotificationSettings(enabled, token)
        })
    }

    updatePushNotificationSettings(enabled: boolean, token: string) {
        this.pushNotificationEnabled = enabled
        this.pushNotificationToken = token

        log.debug(`Notification settings changed: ${enabled} token: ${token}`)
    }
}
