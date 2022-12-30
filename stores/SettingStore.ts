import { action, makeObservable, observable, reaction } from "mobx"
import { makePersistable } from "mobx-persist-store"
import UserModel from "models/User"
import AsyncStorage from "@react-native-async-storage/async-storage"
import messaging from "@react-native-firebase/messaging"
import { updateUser, getAccessToken, getUser, pongUser } from "services/SatimotoService"
import { StoreInterface, Store } from "stores/Store"
import { DataPingNotification } from "types/notification"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"

const log = new Log("SettingStore")

export interface SettingStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    accessToken?: string
    referralCode?: string
    pushNotificationEnabled: boolean
    pushNotificationToken?: string

    onDataPingNotification(notification: DataPingNotification): Promise<void>
    requestPushNotificationPermission(): Promise<boolean>
    setPushNotificationSettings(enabled: boolean, token: string): void
}

export class SettingStore implements SettingStoreInterface {
    hydrated = false
    ready = false
    stores

    accessToken?: string = undefined
    pushNotificationEnabled = false
    pushNotificationToken?: string = undefined
    referralCode?: string = undefined

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            accessToken: observable,
            pushNotificationEnabled: observable,
            pushNotificationToken: observable,
            referralCode: observable,

            setAccessToken: action,
            setUser: action,
            setPushNotificationSettings: action
        })

        makePersistable(
            this,
            {
                name: "SettingStore",
                properties: ["accessToken", "pushNotificationEnabled", "pushNotificationToken", "referralCode"],
                storage: AsyncStorage,
                debugMode: DEBUG
            },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    async initialize(): Promise<void> {
        reaction(
            () => [this.stores.lightningStore.identityPubkey, this.stores.lightningStore.syncedToChain],
            () => this.reactionGetToken()
        )

        reaction(
            () => this.pushNotificationToken,
            () => this.reactionUpdateUser()
        )

        reaction(
            () => [this.accessToken, this.stores.lightningStore.syncedToChain],
            () => this.reactionGetUser()
        )

        this.setReady()
    }

    async onDataPingNotification(notification: DataPingNotification): Promise<void> {
        await pongUser({pong: notification.ping})
    }

    async reactionGetUser() {
        if (this.accessToken) {
            const getUserResult = await getUser()
            const user = getUserResult.data.getUser as UserModel

            this.setUser(user)

            if (user.node) {
                await this.stores.peerStore.connectPeer(user.node.pubkey, user.node.addr)
            }
        }
    }

    async reactionGetToken() {
        if (!this.accessToken && this.stores.lightningStore.identityPubkey) {
            const token = await getAccessToken(this.stores.lightningStore.identityPubkey, this.pushNotificationToken)

            this.setAccessToken(token)
        }
    }

    async reactionUpdateUser() {
        if (this.accessToken && this.pushNotificationToken) {
            updateUser({ deviceToken: this.pushNotificationToken })
        }
    }

    async requestPushNotificationPermission(): Promise<boolean> {
        let enabled = this.pushNotificationEnabled

        if (!this.pushNotificationEnabled) {
            const authStatus = await messaging().requestPermission()

            enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL
            
            if (enabled) {
                const token = await messaging().getToken()
                this.setPushNotificationSettings(enabled, token)
            }
        }

        return enabled
    }

    setAccessToken(accessToken?: string) {
        this.accessToken = accessToken
    }

    setPushNotificationSettings(enabled: boolean, token: string) {
        this.pushNotificationEnabled = enabled
        this.pushNotificationToken = token

        log.debug(`Notification settings changed: ${enabled} token: ${token}`)
    }

    setReady() {
        this.ready = true
    }

    setUser(user?: UserModel) {
        this.referralCode = user?.referralCode
    }
}
