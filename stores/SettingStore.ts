import { action, makeObservable, observable, reaction, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import FiatCurrencyModel from "models/FiatCurrency"
import FiatRateModel from "models/FiatRate"
import UserModel from "models/User"
import AsyncStorage from "@react-native-async-storage/async-storage"
import NetInfo from "@react-native-community/netinfo"
import messaging from "@react-native-firebase/messaging"
import * as breezSdk from "@breeztech/react-native-breez-sdk"
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
    fiatCurrencies: FiatCurrencyModel[]
    fiatRates: FiatRateModel[]
    selectedFiatCurrencies: string[]
    selectedFiatCurrency?: string
    selectedFiatRate?: number
    referralCode?: string
    pushNotificationEnabled: boolean
    pushNotificationToken?: string
    includeChannelReserve: boolean

    onDataPingNotification(notification: DataPingNotification): Promise<void>
    requestPushNotificationPermission(): Promise<boolean>
    selectNextFiatCurrency(): void
    setBatterySettings(batteryCapacity?: number, batteryPowerAc?: number, batteryPowerDc?: number): void
    setIncludeChannelReserve(include: boolean): void
    setPushNotificationSettings(enabled: boolean, token: string): void
    setSelectedFiatCurrencies(ids: string[]): void
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
    fiatCurrencies
    fiatRates
    selectedFiatCurrencies
    selectedFiatCurrency?: string = undefined
    selectedFiatRate?: number = undefined
    includeChannelReserve = true
    pushNotificationEnabled = false
    pushNotificationToken?: string = undefined
    referralCode?: string = undefined
    traceLogEnabled: boolean = DEBUG

    constructor(stores: Store) {
        this.stores = stores
        this.fiatCurrencies = observable<FiatCurrencyModel>([])
        this.fiatRates = observable<FiatRateModel>([])
        this.selectedFiatCurrencies = observable<string>([])

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            accessToken: observable,
            batteryCapacity: observable,
            batteryPowerAc: observable,
            batteryPowerDc: observable,
            fiatCurrencies: observable,
            fiatRates: observable,
            selectedFiatCurrencies: observable,
            selectedFiatCurrency: observable,
            selectedFiatRate: observable,
            includeChannelReserve: observable,
            pushNotificationEnabled: observable,
            pushNotificationToken: observable,
            referralCode: observable,
            traceLogEnabled: observable,

            actionResetSettings: action,
            actionSetAccessToken: action,
            actionSetBatterySettings: action,
            actionSetFiatCurrencies: action,
            actionSetFiatRates: action,
            actionSetSelectedFiatCurrencies: action,
            actionSetSelectedFiatCurrency: action,
            actionSetUser: action,
            actionSetIncludeChannelReserve: action,
            actionSetPushNotificationSettings: action,
            actionSetTraceLogEnabled: action
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
                    "fiatCurrencies",
                    "fiatRates",
                    "selectedFiatCurrencies",
                    "selectedFiatCurrency",
                    "selectedFiatRate",
                    "includeChannelReserve",
                    "pushNotificationEnabled",
                    "pushNotificationToken",
                    "referralCode",
                    "traceLogEnabled"
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

        reaction(
            () => [this.stores.uiStore.appState, this.stores.lightningStore.syncedToChain],
            () => this.reactionAppState()
        )

        when(
            () => this.stores.lightningStore.syncedToChain,
            () => this.whenSyncedToChain()
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

                        if (inputParams.type === breezSdk.InputTypeVariant.LN_URL_AUTH) {
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

    selectNextFiatCurrency() {
        if (this.selectedFiatCurrencies.length > 0) {
            const index = this.selectedFiatCurrency ? this.selectedFiatCurrencies.indexOf(this.selectedFiatCurrency) : 0

            if (index < this.selectedFiatCurrencies.length - 1) {
                this.actionSetSelectedFiatCurrency(this.selectedFiatCurrencies[index + 1])
            } else {
                this.actionSetSelectedFiatCurrency(this.selectedFiatCurrencies[0])
            }
        }
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

    setSelectedFiatCurrencies(ids: string[]) {
        this.actionSetSelectedFiatCurrencies(ids)
    }

    setTraceLogEnabled(enabled: boolean) {
        this.actionSetTraceLogEnabled(enabled)
    }

    async updateFiatCurrencies() {
        const fiatCurrencies = await breezSdk.listFiatCurrencies()

        this.actionSetFiatCurrencies(
            fiatCurrencies.map(({ id, info }) => {
                return { id, name: info.name, decimals: info.fractionSize, symbol: info.symbol?.grapheme || "" }
            })
        )
    }

    async updateFiatRates() {
        const fiatRates = await breezSdk.fetchFiatRates()

        this.actionSetFiatRates(
            fiatRates.map(({ coin, value }) => {
                return { id: coin, value }
            })
        )
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

    actionSetFiatCurrencies(fiatCurrencies: FiatCurrencyModel[]) {
        this.fiatCurrencies.replace(fiatCurrencies.sort((a, b) => a.name.localeCompare(b.name)))

        this.actionSetSelectedFiatCurrencies(
            this.selectedFiatCurrencies.filter((id) => this.fiatCurrencies.findIndex((fiatCurrency) => fiatCurrency.id === id) !== -1)
        )
    }

    actionSetFiatRates(fiatRates: FiatRateModel[]) {
        const fiatRate = fiatRates.find((fiatRate) => fiatRate.id === this.selectedFiatCurrency)

        this.fiatRates.replace(fiatRates)
        this.selectedFiatRate = fiatRate ? fiatRate.value : undefined
    }

    actionSetSelectedFiatCurrencies(ids: string[]) {
        this.selectedFiatCurrencies.replace(ids)

        if (this.selectedFiatCurrencies.length > 0) {
            const index = this.selectedFiatCurrency ? this.selectedFiatCurrencies.indexOf(this.selectedFiatCurrency) : -1

            if (index === -1) {
                this.actionSetSelectedFiatCurrency(this.selectedFiatCurrencies[0])
            }
        } else {
            this.actionSetSelectedFiatCurrency(undefined)
        }
    }

    actionSetSelectedFiatCurrency(id?: string) {
        const fiatRate = id ? this.fiatRates.find((fiatRate) => fiatRate.id === id) : undefined

        this.selectedFiatCurrency = id
        this.selectedFiatRate = fiatRate ? fiatRate.value : undefined
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

    actionSetTraceLogEnabled(enabled: boolean): void {
        this.traceLogEnabled = enabled
    }

    actionSetUser(user?: UserModel) {
        this.referralCode = user?.referralCode
        this.batteryCapacity = user?.batteryCapacity
        this.batteryPowerAc = user?.batteryPowerAc
        this.batteryPowerDc = user?.batteryPowerDc
    }

    async reactionAppState() {
        if (this.stores.lightningStore.syncedToChain && this.stores.uiStore.appState === "active") {
            this.updateFiatRates()
        }
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

    async whenSyncedToChain(): Promise<void> {
        if (this.stores.lightningStore.backend == LightningBackend.BREEZ_SDK) {
            this.updateFiatCurrencies()
            this.updateFiatRates()
        }
    }
}
