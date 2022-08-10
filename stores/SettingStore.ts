import { action, makeObservable, observable, reaction } from "mobx"
import { makePersistable } from "mobx-persist-store"
import AsyncStorage from "@react-native-async-storage/async-storage"
import messaging from "@react-native-firebase/messaging"
import { StoreInterface, Store } from "stores/Store"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"
import { updateUser, getToken } from "services/SatimotoService"

const log = new Log("SettingStore")

export interface SettingStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    accessToken?: string
    pushNotificationEnabled: boolean
    pushNotificationToken?: string

    requestPushNotificationPermission(): void
}

export class SettingStore implements SettingStoreInterface {
    hydrated = false
    ready = false
    stores

    accessToken?: string = undefined
    pushNotificationEnabled = false
    pushNotificationToken?: string = undefined

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            accessToken: observable,
            pushNotificationEnabled: observable,
            pushNotificationToken: observable,

            setAccessToken: action,
            setPushNotificationSettings: action
        })

        makePersistable(
            this,
            {
                name: "SettingStore",
                properties: ["accessToken", "pushNotificationEnabled", "pushNotificationToken"],
                storage: AsyncStorage,
                debugMode: DEBUG
            },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    async initialize(): Promise<void> {
        reaction(
            () => [this.pushNotificationToken, this.stores.lightningStore.identityPubkey],
            async () => {
                if (!this.accessToken && this.pushNotificationToken && this.stores.lightningStore.identityPubkey) {
                    const token = await getToken(this.stores.lightningStore.identityPubkey, this.pushNotificationToken)

                    this.setAccessToken(token)
                }
            }
        )

        reaction(
            () => this.pushNotificationToken,
            () => {
                if (this.accessToken && this.pushNotificationToken) {
                    updateUser({ deviceToken: this.pushNotificationToken })
                }
            }
        )

        this.setReady()
    }

    setReady() {
        this.ready = true
    }

    async requestPushNotificationPermission() {
        const authStatus = await messaging().requestPermission()
        const token = await messaging().getToken()

        const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL
        this.setPushNotificationSettings(enabled, token)

        messaging().onTokenRefresh((token) => {
            this.setPushNotificationSettings(enabled, token)
        })
    }

    setAccessToken(accessToken?: string) {
        this.accessToken = accessToken
    }

    setPushNotificationSettings(enabled: boolean, token: string) {
        this.pushNotificationEnabled = enabled
        this.pushNotificationToken = token

        log.debug(`Notification settings changed: ${enabled} token: ${token}`)
    }
}
