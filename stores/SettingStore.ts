import { action, makeObservable, observable, reaction } from "mobx"
import { makePersistable } from "mobx-persist-store"
import UserModel from "models/User"
import AsyncStorage from "@react-native-async-storage/async-storage"
import NetInfo from "@react-native-community/netinfo"
import messaging from "@react-native-firebase/messaging"
import * as breezSdk from "react-native-breez-sdk"
import { updateUser, getUser, pongUser, createAuthentication, AuthenticationAction, createUser, exchangeAuthentication } from "services/satimoto"
import { StoreInterface, Store } from "stores/Store"
import { DataPingNotification } from "types/notification"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"
import { doWhileBackoff } from "utils/backoff"
import { LightningBackend } from "types/lightningBackend"

const log = new Log("SettingStore")

export interface SettingStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    accessToken?: string
    batteryCapacity?: number
    batteryPowerAc?: number
    batteryPowerDc?: number
    referralCode?: string
    pushNotificationEnabled: boolean
    pushNotificationToken?: string
    includeChannelReserve: boolean

    onDataPingNotification(notification: DataPingNotification): Promise<void>
    requestPushNotificationPermission(): Promise<boolean>
    setBatterySettings(batteryCapacity?: number, batteryPowerAc?: number, batteryPowerDc?: number): void
    setIncludeChannelReserve(include: boolean): void
    setPushNotificationSettings(enabled: boolean, token: string): void
}

export class SettingStore implements SettingStoreInterface {
    hydrated = false
    ready = false
    queue: any = undefined
    stores

    accessToken?: string = undefined
    batteryCapacity?: number = undefined
    batteryPowerAc?: number = undefined
    batteryPowerDc?: number = undefined
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
            batteryCapacity: observable,
            batteryPowerAc: observable,
            batteryPowerDc: observable,
            includeChannelReserve: observable,
            pushNotificationEnabled: observable,
            pushNotificationToken: observable,
            referralCode: observable,

            actionResetSettings: action,
            actionSetAccessToken: action,
            actionSetBatterySettings: action,
            actionSetUser: action,
            actionSetIncludeChannelReserve: action,
            actionSetPushNotificationSettings: action
        })

        makePersistable(
            this,
            {
                name: "SettingStore",
                properties: [
                    "accessToken",
                    "batteryCapacity",
                    "batteryPowerAc",
                    "batteryPowerDc",
                    "includeChannelReserve",
                    "pushNotificationEnabled",
                    "pushNotificationToken",
                    "referralCode"
                ],
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
            () => [this.batteryCapacity, this.batteryPowerAc, this.batteryPowerDc, this.pushNotificationToken],
            () => this.reactionUpdateUser()
        )

        reaction(
            () => [this.accessToken, this.stores.lightningStore.syncedToChain],
            () => this.reactionGetUser()
        )

        this.actionSetReady()
    }

    async getAccessToken() {
        return doWhileBackoff(
            "getAccessToken",
            async () => {
                try {
                    if (this.stores.lightningStore.identityPubkey) {
                        const createAuthenticationResult = await createAuthentication(AuthenticationAction.REGISTER)
                        log.debug("SAT024: CreateAuthentication: " + JSON.stringify(createAuthenticationResult.data.createAuthentication))

                        const inputParams = await breezSdk.parseInput(createAuthenticationResult.data.createAuthentication.lnUrl)
                        log.debug("SAT062: parseInput: " + JSON.stringify(inputParams))

                        if (inputParams.type === breezSdk.InputType.LNURL_AUTH) {
                            const lnUrlAuthRequestData = inputParams.data as breezSdk.LnUrlAuthRequestData
                            const authenticateOk = await this.stores.lightningStore.authLnurl(lnUrlAuthRequestData)

                            log.debug("SAT025: Authentication: " + JSON.stringify(authenticateOk))

                            if (authenticateOk) {
                                try {
                                    // TODO: select a different node
                                    await createUser({
                                        code: createAuthenticationResult.data.createAuthentication.code,
                                        pubkey: this.stores.lightningStore.identityPubkey,
                                        deviceToken: this.pushNotificationToken,
                                        lsp: this.stores.lightningStore.backend === LightningBackend.LND
                                    })
                                } catch (error) {
                                    log.debug(`SAT026: Error creating user: ${error}`, true)
                                }

                                const exchangeAuthenticationResult = await exchangeAuthentication(
                                    createAuthenticationResult.data.createAuthentication.code
                                )

                                log.debug(
                                    "SAT027: ExchangeAuthentication: " + JSON.stringify(exchangeAuthenticationResult.data.exchangeAuthentication)
                                )

                                return exchangeAuthenticationResult.data.exchangeAuthentication.token
                            }
                        }
                    }
                } catch (error) {
                    log.error(`SAT028: Error getting token: ${error}`, true)
                }
            },
            5000
        )
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

    reset() {
        this.actionResetSettings()
    }

    setBatterySettings(batteryCapacity?: number, batteryPowerAc?: number, batteryPowerDc?: number) {
        this.actionSetBatterySettings(batteryCapacity, batteryPowerAc, batteryPowerDc)
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

    actionResetSettings() {
        this.accessToken = undefined
        this.pushNotificationEnabled = false
        this.pushNotificationToken = undefined
        this.referralCode = undefined
    }

    actionSetAccessToken(accessToken?: string) {
        this.accessToken = accessToken
    }

    actionSetBatterySettings(batteryCapacity?: number, batteryPowerAc?: number, batteryPowerDc?: number) {
        this.batteryCapacity = batteryCapacity
        this.batteryPowerAc = batteryPowerAc
        this.batteryPowerDc = batteryPowerDc
    }

    actionSetIncludeChannelReserve(include: boolean) {
        this.includeChannelReserve = include
    }

    actionSetPushNotificationSettings(enabled: boolean, token: string) {
        this.pushNotificationEnabled = enabled
        this.pushNotificationToken = token

        log.debug(`SAT077: Notification settings changed: ${enabled} token: ${token}`)
    }

    actionSetReady() {
        this.ready = true
    }

    actionSetUser(user?: UserModel) {
        this.referralCode = user?.referralCode
        this.batteryCapacity = user?.batteryCapacity
        this.batteryPowerAc = user?.batteryPowerAc
        this.batteryPowerDc = user?.batteryPowerDc
    }

    async reactionGetUser() {
        if (this.accessToken) {
            const getUserResult = await getUser()
            const user = getUserResult.data.getUser as UserModel

            this.actionSetUser(user)

            if (user.node && this.stores.lightningStore.backend == LightningBackend.LND) {
                await this.stores.peerStore.connectPeer(user.node.pubkey, user.node.addr)
            }
        }
    }

    async reactionGetToken() {
        if (!this.accessToken && this.stores.lightningStore.identityPubkey) {
            const token = await this.getAccessToken()

            this.actionSetAccessToken(token)
        }
    }

    async reactionUpdateUser() {
        if (this.accessToken) {
            updateUser({
                batteryCapacity: this.batteryCapacity,
                batteryPowerAc: this.batteryPowerAc,
                batteryPowerDc: this.batteryPowerDc,
                deviceToken: this.pushNotificationToken
            })
        }
    }
}
