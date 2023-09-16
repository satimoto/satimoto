import Long from "long"
import { action, makeObservable, observable, reaction, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import { NativeEventEmitter, NativeModules } from "react-native"
import * as breezSdk from "@breeztech/react-native-breez-sdk"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { chainrpc, lnrpc } from "proto/proto"
import { StoreInterface, Store } from "stores/Store"
import * as lightning from "services/lightning"
import * as lnd from "services/lnd"
import * as lnUrl from "services/lnUrl"
import { LightningBackend } from "types/lightningBackend"
import { WalletState } from "types/wallet"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"
import { timeout } from "utils/backoff"
import { deepCopy } from "utils/conversion"
import { PaymentStatus, fromBreezPayment } from "types/payment"

const log = new Log("LightningStore")

const BreezSDK = NativeModules.RNBreezSDK
const BreezSDKEmitter = new NativeEventEmitter(BreezSDK)

export interface LightningStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    backend: LightningBackend
    blockHeight: number
    identityPubkey?: string
    startedLogEvents: boolean
    subscribedBlockEpoch: boolean
    subscribedBreezEvents: boolean
    bestHeaderTimestamp: string
    syncHeaderTimestamp: string
    syncedToChain: boolean
    percentSynced: number

    authLnurl(authParams: breezSdk.LnUrlAuthRequestData): Promise<boolean>
    switchBackend(backend: LightningBackend): Promise<void>
}

export class LightningStore implements LightningStoreInterface {
    hydrated = false
    ready = false
    stores

    backend: LightningBackend = LightningBackend.NONE
    blockHeight = 0
    identityPubkey?: string = undefined
    startedLogEvents = false
    subscribedBlockEpoch = false
    subscribedBreezEvents = false
    bestHeaderTimestamp = "0"
    syncHeaderTimestamp = "0"
    syncedToChain = false
    percentSynced = 0

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            backend: observable,
            blockHeight: observable,
            identityPubkey: observable,
            startedLogEvents: observable,
            subscribedBlockEpoch: observable,
            subscribedBreezEvents: observable,
            bestHeaderTimestamp: observable,
            syncedToChain: observable,
            percentSynced: observable,

            actionCalculatePercentSynced: action,
            actionResetLightning: action,
            actionSetBackend: action,
            actionSetBlockHeight: action,
            actionSetReady: action,
            actionSetSynced: action,
            actionSetSyncHeaderTimestamp: action,
            actionSubscribeEvents: action,
            actionUpdateNodeInfo: action
        })

        makePersistable(
            this,
            {
                name: "LightningStore",
                properties: ["backend", "identityPubkey", "blockHeight", "bestHeaderTimestamp"],
                storage: AsyncStorage,
                debugMode: DEBUG
            },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    async initialize(): Promise<void> {
        try {
            reaction(
                () => [this.backend],
                () => this.reactionBackend(),
                { fireImmediately: true }
            )

            reaction(
                () => [this.stores.walletStore.state],
                () => this.reactionState(),
                { fireImmediately: true }
            )

            if (this.backend === LightningBackend.NONE) {
                this.actionSetBackend(this.identityPubkey ? LightningBackend.LND : LightningBackend.BREEZ_SDK)
            }

            if (this.stores.settingStore.traceLogEnabled) {
                await this.startLogEvents()
            }
        } catch (error) {
            log.error(`SAT048: Error Initializing: ${error}`, true)
        }
    }

    receiveBreezEvent(event: breezSdk.BreezEvent) {
        log.debug(`SAT071: ${event.type}: ${JSON.stringify(event)}`, true)

        switch (event.type) {
            case breezSdk.BreezEventVariant.INVOICE_PAID:
                this.stores.invoiceStore.settleInvoice(event.details.paymentHash)
                break
            case breezSdk.BreezEventVariant.NEW_BLOCK:
                this.actionSetBlockHeight(event.block)
                break
            case breezSdk.BreezEventVariant.PAYMENT_FAILED:
                const { error, invoice } = event.details
                const failedPayment = invoice && this.stores.paymentStore.findPayment(invoice.paymentHash)

                if (failedPayment) {
                    failedPayment.status = PaymentStatus.FAILED
                    failedPayment.failureReasonKey = error

                    this.stores.paymentStore.updatePayment(failedPayment)
                }
                break
            case breezSdk.BreezEventVariant.PAYMENT_SUCCEED:
                const lnPayment = event.details

                if (lnPayment.details.type === breezSdk.PaymentDetailsVariant.LN) {
                    const payment = fromBreezPayment(lnPayment, lnPayment.details.data as breezSdk.LnPaymentDetails)
                    payment.status = PaymentStatus.SUCCEEDED

                    this.stores.paymentStore.updatePayment(payment)
                }
                break
            case breezSdk.BreezEventVariant.SYNCED:
                this.actionSetSynced()
                this.stores.channelStore.getChannelBalance()
                this.stores.walletStore.setState(WalletState.STARTED)
                break
        }
    }

    async getNodeInfo() {
        if (this.backend === LightningBackend.BREEZ_SDK) {
            const { id } = await breezSdk.nodeInfo()
            this.actionUpdateNodeInfo(this.blockHeight, this.bestHeaderTimestamp, id, this.syncedToChain)
        } else if (this.backend === LightningBackend.LND) {
            const { blockHeight, bestHeaderTimestamp, identityPubkey, syncedToChain }: lnrpc.GetInfoResponse = await lnd.getInfo()
            this.actionUpdateNodeInfo(blockHeight, bestHeaderTimestamp.toString(), identityPubkey, syncedToChain)
        }
    }

    async authLnurl(authParams: breezSdk.LnUrlAuthRequestData): Promise<boolean> {
        if (this.backend === LightningBackend.BREEZ_SDK) {
            const authResponse = await breezSdk.lnurlAuth(deepCopy(authParams))

            if (authResponse.type === breezSdk.LnUrlCallbackStatusVariant.OK) {
                return true
            } else if (authResponse.data.reason) {
                throw new Error(authResponse.data.reason)
            }
        } else if (this.backend === LightningBackend.LND) {
            return lnUrl.authenticate({
                tag: authParams.action || "login",
                k1: authParams.k1,
                callback: authParams.url,
                domain: authParams.domain
            })
        }

        return false
    }

    async startLogEvents() {
        if (!this.startedLogEvents) {
            await lightning.startLogEvents(this.backend)
            this.startedLogEvents = true
        }
    }

    async switchBackend(backend: LightningBackend) {
        if (backend !== this.backend) {
            if (this.backend === LightningBackend.BREEZ_SDK) {
                await breezSdk.disconnect()
            } else if (this.backend === LightningBackend.LND) {
                await lnd.stop()
            }

            this.stores.channelStore.reset()
            this.stores.invoiceStore.reset()
            this.stores.paymentStore.reset()
            this.stores.peerStore.reset()
            this.stores.sessionStore.reset()
            this.stores.settingStore.reset()
            this.stores.transactionStore.reset()
            this.stores.walletStore.reset()

            this.actionResetLightning()
            this.actionSetBackend(backend)
        }
    }

    async walletStarted() {
        log.debug(`SAT104: walletStated`, true)

        if (this.backend === LightningBackend.BREEZ_SDK) {
            this.percentSynced = 50
        } else if (this.backend === LightningBackend.LND) {
            this.actionSetSyncHeaderTimestamp(this.bestHeaderTimestamp)

            while (true) {
                await this.getNodeInfo()
                this.actionCalculatePercentSynced()

                if (this.syncedToChain) {
                    break
                }

                await timeout(6000)
            }

            this.actionSetReady()
        }
    }

    /*
     * Mobx actions and reactions
     */

    actionCalculatePercentSynced() {
        if (this.syncHeaderTimestamp === "0") {
            this.actionSetSyncHeaderTimestamp(this.bestHeaderTimestamp)
        }

        if (this.syncedToChain) {
            this.percentSynced = 100
        } else {
            const bestHeaderTimestamp = Long.fromString(this.bestHeaderTimestamp)
            const syncHeaderTimestamp = Long.fromString(this.syncHeaderTimestamp)
            const timestamp = Long.fromValue(new Date().getTime() / 1000)
            const progress = bestHeaderTimestamp.subtract(syncHeaderTimestamp).toNumber()
            const total = timestamp.subtract(syncHeaderTimestamp).toNumber()
            this.percentSynced = (100.0 / total) * progress
        }

        log.debug(`SAT050: Percent Synced: ${this.percentSynced}`, true)
    }

    actionResetLightning() {
        this.blockHeight = 0
        this.identityPubkey = undefined
        this.bestHeaderTimestamp = "0"
        this.syncHeaderTimestamp = "0"
        this.syncedToChain = false
        this.percentSynced = 0
        this.subscribedBlockEpoch = false
    }

    actionSetBackend(backend: LightningBackend) {
        log.debug(`SAT022: Backend: ${backend}`, true)
        this.backend = backend
    }

    actionSetBlockHeight(height: number) {
        log.debug(`SAT049: Height: ${height}`)
        this.blockHeight = height

        if (this.backend === LightningBackend.LND || !this.identityPubkey) {
            this.getNodeInfo()
        }
    }

    actionSetReady() {
        this.ready = true
    }

    actionSetSynced() {
        this.syncedToChain = true
        this.percentSynced = 100
    }

    actionSetSyncHeaderTimestamp(timestamp: string) {
        this.syncHeaderTimestamp = timestamp
    }

    actionSubscribeEvents() {
        if (!this.subscribedBreezEvents) {
            log.debug(`SAT105: actionSubscribeEvents`, true)

            BreezSDKEmitter.addListener("breezSdkEvent", (event) => {
                this.receiveBreezEvent(event)
            })

            this.subscribedBreezEvents = true
        }
    }

    actionUpdateNodeInfo(blockHeight: number, bestHeaderTimestamp: string, identityPubkey: string | undefined, syncedToChain: boolean) {
        this.blockHeight = blockHeight
        this.identityPubkey = identityPubkey
        this.bestHeaderTimestamp = bestHeaderTimestamp
        this.syncedToChain = syncedToChain
    }

    async reactionBackend() {
        if (this.backend === LightningBackend.BREEZ_SDK) {
            this.actionSubscribeEvents()
        } else if (this.backend === LightningBackend.LND) {
            when(
                () => this.syncedToChain,
                () => this.whenSyncedToChain()
            )
        }
    }

    reactionState() {
        if (this.stores.walletStore.state === WalletState.STARTED) {
            this.walletStarted()
        }
    }

    whenSyncedToChain() {
        if (!this.subscribedBlockEpoch) {
            lnd.registerBlockEpochNtfn(({ height }: chainrpc.BlockEpoch) => this.actionSetBlockHeight(height))
            this.subscribedBlockEpoch = true
        }
    }
}
