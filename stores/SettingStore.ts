import { action, makeObservable, observable, reaction } from "mobx"
import { makePersistable } from "mobx-persist-store"
import UserModel from "models/User"
import AsyncStorage from "@react-native-async-storage/async-storage"
import NetInfo from "@react-native-community/netinfo"
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
    includeChannelReserve: boolean

    onDataPingNotification(notification: DataPingNotification): Promise<void>
    requestPushNotificationPermission(): Promise<boolean>
    setIncludeChannelReserve(include: boolean): void
    setPushNotificationSettings(enabled: boolean, token: string): void
}

export class SettingStore implements SettingStoreInterface {
    hydrated = false
    ready = false
    queue: any = undefined
    stores

    accessToken?: string = undefined
    includeChannelReserve = true
    pushNotificationEnabled = false
    pushNotificationToken?: string = undefined
    referralCode?: string = undefined

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            accessToken: observable,
            includeChannelReserve: observable,
            pushNotificationEnabled: observable,
            pushNotificationToken: observable,
            referralCode: observable,

            actionSetAccessToken: action,
            actionSetUser: action,
            actionSetIncludeChannelReserve: action,
            actionSetPushNotificationSettings: action
        })

        makePersistable(
            this,
            {
                name: "SettingStore",
                properties: ["accessToken", "includeChannelReserve", "pushNotificationEnabled", "pushNotificationToken", "referralCode"],
                storage: AsyncStorage,
                debugMode: DEBUG
            },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    async initialize(): Promise<void> {
        this.queue = this.stores.queue

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

        this.actionSetReady()
    }

    async onDataPingNotification(notification: DataPingNotification): Promise<void> {
        if (this.stores.uiStore.appState === "background") {
            const netState = await NetInfo.fetch()

            this.queue.createJob(
                "data-ping-notification",
                notification,
                {
                    attempts: 3,
                    timeout: 1000
                },
                netState.isConnected && netState.isInternetReachable
            )
        } else {
            await this.workerDataPingNotification(notification)
        }
    }

    async requestPushNotificationPermission(): Promise<boolean> {
        let enabled = this.pushNotificationEnabled

        if (!this.pushNotificationEnabled) {
            const authStatus = await messaging().requestPermission()

            enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL

            if (enabled) {
                const token = await messaging().getToken()
                this.actionSetPushNotificationSettings(enabled, token)
            }
        }

        return enabled
    }

    setIncludeChannelReserve(include: boolean) {
        this.actionSetIncludeChannelReserve(include)
    }

    setPushNotificationSettings(enabled: boolean, token: string) {
        this.setPushNotificationSettings(enabled, token)
    }

    /*
     * Queue workers
     */

    async workerDataPingNotification(notification: DataPingNotification): Promise<void> {
        await pongUser({ pong: notification.ping })
    }

    /*
     * Mobx actions and reactions
     */

    actionSetAccessToken(accessToken?: string) {
        this.accessToken = accessToken
    }

    actionSetIncludeChannelReserve(include: boolean) {
        this.includeChannelReserve = include
    }

    actionSetPushNotificationSettings(enabled: boolean, token: string) {
        this.pushNotificationEnabled = enabled
        this.pushNotificationToken = token

        log.debug(`Notification settings changed: ${enabled} token: ${token}`)
    }

    actionSetReady() {
        this.ready = true
    }

    actionSetUser(user?: UserModel) {
        this.referralCode = user?.referralCode
    }

    async reactionGetUser() {
        if (this.accessToken) {
            const getUserResult = await getUser()
            const user = getUserResult.data.getUser as UserModel

            this.actionSetUser(user)

            if (user.node) {
                await this.stores.peerStore.connectPeer(user.node.pubkey, user.node.addr)
            }
        }
    }

    async reactionGetToken() {
        if (!this.accessToken && this.stores.lightningStore.identityPubkey) {
            const token = await getAccessToken(this.stores.lightningStore.identityPubkey, this.pushNotificationToken)

            this.actionSetAccessToken(token)
        }
    }

    async reactionUpdateUser() {
        if (this.accessToken && this.pushNotificationToken) {
            updateUser({ deviceToken: this.pushNotificationToken })
        }
    }
}
