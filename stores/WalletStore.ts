import { action, makeObservable, observable, reaction } from "mobx"
import { makePersistable } from "mobx-persist-store"
import { lnrpc } from "proto/proto"
import AsyncStorage from "@react-native-async-storage/async-storage"
import bip39 from "react-native-bip39"
import * as breezSdk from "@breeztech/react-native-breez-sdk"
import { generateSecureRandom } from "react-native-securerandom"
import { StoreInterface, Store } from "stores/Store"
import * as lnd from "services/lnd"
import * as lightning from "services/lightning"
import { fromLndWalletState, WalletState } from "types/wallet"
import { LightningBackend } from "types/lightningBackend"
import { toBreezNetwork } from "types/network"
import { BREEZ_SDK_API_KEY, DEBUG, GREENLIGHT_PARTNER_CERT, GREENLIGHT_PARTNER_KEY, NETWORK } from "utils/build"
import {
    RECOVERY_WINDOW_DEFAULT,
    SECURE_KEY_WALLET_PASSWORD,
    SECURE_KEY_CIPHER_SEED_MNEMONIC,
    SECURE_KEY_BREEZ_SDK_SEED_MNEMONIC,
    SECURE_KEY_GREENLIGHT_DEVICE_KEY_STORE,
    SECURE_KEY_GREENLIGHT_DEVICE_CERT_STORE
} from "utils/constants"
import { bytesToBase64, toNumber, toSatoshi } from "utils/conversion"
import { Log } from "utils/logging"
import { getSecureItem, removeSecureItem, setSecureItem } from "utils/storage"

const log = new Log("WalletStore")

export interface WalletStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    state: WalletState
    subscribedState: boolean
    totalBalance: number
    confirmedBalance: number
    unconfirmedBalance: number
    lockedBalance: number
    reservedBalance: number
    lastTxid?: string

    refreshWalletBalance(): Promise<void>
    getMnemonic(backend: LightningBackend): Promise<string[]>
    setMnemonic(backend: LightningBackend, mnemonic: string[]): Promise<void>
    sweep(address: string): Promise<void>
}

export class WalletStore implements WalletStoreInterface {
    hydrated = false
    ready = false
    stores

    state = WalletState.WAITING_TO_START
    subscribedState = false
    totalBalance: number = 0
    confirmedBalance: number = 0
    unconfirmedBalance: number = 0
    lockedBalance: number = 0
    reservedBalance: number = 0
    lastTxid?: string = undefined

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            state: observable,
            subscribedState: observable,
            totalBalance: observable,
            confirmedBalance: observable,
            unconfirmedBalance: observable,
            lockedBalance: observable,
            reservedBalance: observable,
            lastTxid: observable,

            actionResetWallet: action,
            actionSetReady: action,
            actionSetState: action,
            actionSubscribeState: action,
            actionUpdateWalletBalance: action
        })

        makePersistable(
            this,
            {
                name: "WalletStore",
                properties: ["totalBalance", "confirmedBalance", "unconfirmedBalance", "lockedBalance", "reservedBalance", "lastTxid"],
                storage: AsyncStorage,
                debugMode: DEBUG
            },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    async initialize(): Promise<void> {
        try {
            // React when first run or backend changes
            reaction(
                () => [this.stores.lightningStore.backend, this.stores.uiStore.hasOnboardingUpdates],
                () => this.reactionBackend(),
                { fireImmediately: true }
            )

            // React when the wallet state changes
            reaction(
                () => [this.state],
                () => this.reactionState()
            )

            reaction(
                () => [this.stores.lightningStore.syncedToChain],
                () => this.reactionSyncedToChain()
            )
        } catch (error) {
            log.error(`SAT087: Error Initializing: ${error}`, true)
        }
    }

    async createWallet() {
        if (this.stores.lightningStore.backend === LightningBackend.BREEZ_SDK) {
            let mnemonic: string = await getSecureItem(SECURE_KEY_BREEZ_SDK_SEED_MNEMONIC)
            const createMnemonic: boolean = !mnemonic

            if (createMnemonic) {
                mnemonic = await bip39.generateMnemonic(128, null, bip39.wordlists.EN)
                setSecureItem(SECURE_KEY_BREEZ_SDK_SEED_MNEMONIC, mnemonic)
            }

            log.debug(`mnemonic: ${mnemonic}`)

            const seed = await lightning.mnemonicToSeed(mnemonic)
            const network = toBreezNetwork(NETWORK)
            let creds: breezSdk.GreenlightCredentials

            if (createMnemonic) {
                creds = await breezSdk.registerNode(network, seed, { deviceCert: GREENLIGHT_PARTNER_CERT, deviceKey: GREENLIGHT_PARTNER_KEY })
            } else {
                creds = await breezSdk.recoverNode(network, seed)
            }

            if (creds) {
                setSecureItem(SECURE_KEY_GREENLIGHT_DEVICE_KEY_STORE, creds.deviceKey)
                setSecureItem(SECURE_KEY_GREENLIGHT_DEVICE_CERT_STORE, creds.deviceCert)

                const config = await breezSdk.defaultConfig(breezSdk.EnvironmentType.PRODUCTION)
                config.apiKey = BREEZ_SDK_API_KEY

                await breezSdk.initServices(config, creds.deviceKey, creds.deviceCert, seed)
                await breezSdk.start()

                this.actionSetState(WalletState.STARTED)
            }
        } else if (this.stores.lightningStore.backend === LightningBackend.LND) {
            let seedMnemonic: string[] = await getSecureItem(SECURE_KEY_CIPHER_SEED_MNEMONIC)
            let password: string = await getSecureItem(SECURE_KEY_WALLET_PASSWORD)
            const recoveryWindow: number = seedMnemonic ? RECOVERY_WINDOW_DEFAULT : 0

            // Create seed mnemonic
            if (!seedMnemonic) {
                const genSeedResponse: lnrpc.GenSeedResponse = await lnd.genSeed()
                seedMnemonic = genSeedResponse.cipherSeedMnemonic
                await setSecureItem(SECURE_KEY_CIPHER_SEED_MNEMONIC, seedMnemonic)
            }

            // Create wallet password
            if (!password) {
                const passwordBytes: Uint8Array = await generateSecureRandom(32)
                password = bytesToBase64(passwordBytes)
                await setSecureItem(SECURE_KEY_WALLET_PASSWORD, password)
            }

            log.debug(`SAT088: Seed: ${seedMnemonic.join(" ")}`)
            log.debug(`SAT088: Password: ${password}`)

            // Init wallet
            await lnd.initWallet(seedMnemonic, password, recoveryWindow)
        }
    }

    async getMnemonic(backend: LightningBackend): Promise<string[]> {
        if (backend === LightningBackend.BREEZ_SDK) {
            const seedMnemonic: string = await getSecureItem(SECURE_KEY_BREEZ_SDK_SEED_MNEMONIC)

            if (seedMnemonic) {
                return seedMnemonic.split(" ")
            }
        } else if (backend === LightningBackend.LND) {
            const seedMnemonic: string[] = await getSecureItem(SECURE_KEY_CIPHER_SEED_MNEMONIC)

            if (seedMnemonic) {
                return seedMnemonic
            }
        }

        throw Error("Mnemonic not found")
    }

    async refreshWalletBalance() {
        if (this.stores.lightningStore.backend === LightningBackend.BREEZ_SDK) {
            const { onchainBalanceMsat, maxChanReserveMsats } = await breezSdk.nodeInfo()
            const onchainBalance = toNumber(toSatoshi(onchainBalanceMsat))
            const maxChanReserve = toNumber(toSatoshi(maxChanReserveMsats))

            this.actionUpdateWalletBalance(onchainBalance, onchainBalance, this.unconfirmedBalance, maxChanReserve, maxChanReserve)
        } else if (this.stores.lightningStore.backend === LightningBackend.LND) {
            const { totalBalance, confirmedBalance, unconfirmedBalance, lockedBalance, reservedBalanceAnchorChan } = await lnd.walletBalance()

            this.actionUpdateWalletBalance(
                toNumber(totalBalance),
                toNumber(confirmedBalance),
                toNumber(unconfirmedBalance),
                toNumber(lockedBalance),
                toNumber(reservedBalanceAnchorChan)
            )
        }
    }

    reset() {
        this.actionResetWallet()
    }

    async setMnemonic(backend: LightningBackend, mnemonic: string[]) {
        if (this.stores.lightningStore.backend !== backend) {
            if (backend === LightningBackend.BREEZ_SDK) {
                const seedMnemonic: string = mnemonic.join(" ")

                await lightning.mnemonicToSeed(seedMnemonic)
                await setSecureItem(SECURE_KEY_BREEZ_SDK_SEED_MNEMONIC, seedMnemonic)
                await removeSecureItem(SECURE_KEY_GREENLIGHT_DEVICE_KEY_STORE)
                await removeSecureItem(SECURE_KEY_GREENLIGHT_DEVICE_CERT_STORE)
            }
        }
    }

    setState(state: WalletState) {
        this.actionSetState(state)
    }

    subscribeStateResponse({ state }: lnrpc.SubscribeStateResponse) {
        this.actionSetState(fromLndWalletState(state))
    }

    async sweep(address: string) {
        if (this.stores.lightningStore.backend === LightningBackend.BREEZ_SDK) {
            const recommendedFees = await breezSdk.recommendedFees()
            await breezSdk.sweep(address, recommendedFees.hourFee)

            this.refreshWalletBalance()
        } else if (this.stores.lightningStore.backend === LightningBackend.LND) {
            const response = await lnd.sendCoins({ addr: address })

            this.actionSetLastTxid(response.txid)
            this.refreshWalletBalance()
        }
    }

    async unlockWallet() {
        if (this.stores.lightningStore.backend === LightningBackend.BREEZ_SDK) {
            const seedMnemonic: string = await getSecureItem(SECURE_KEY_BREEZ_SDK_SEED_MNEMONIC)
            const seed: Uint8Array = await lightning.mnemonicToSeed(seedMnemonic)
            const deviceKey: Uint8Array = await getSecureItem(SECURE_KEY_GREENLIGHT_DEVICE_KEY_STORE)
            const deviceCert: Uint8Array = await getSecureItem(SECURE_KEY_GREENLIGHT_DEVICE_CERT_STORE)

            const config = await breezSdk.defaultConfig(breezSdk.EnvironmentType.PRODUCTION)
            config.apiKey = BREEZ_SDK_API_KEY

            log.debug(`SAT107: unlockWallet: initServices`)
            await breezSdk.initServices(config, deviceKey, deviceCert, seed)
            log.debug(`SAT108: unlockWallet: start`)
            breezSdk.start()
        } else if (this.stores.lightningStore.backend === LightningBackend.LND) {
            const password: string = await getSecureItem(SECURE_KEY_WALLET_PASSWORD)
            await lnd.unlockWallet(password)
        }
    }

    /*
     * Mobx actions and reactions
     */

    actionResetWallet() {
        this.totalBalance = 0
        this.confirmedBalance = 0
        this.unconfirmedBalance = 0
        this.lockedBalance = 0
        this.reservedBalance = 0
        this.state = WalletState.WAITING_TO_START
        this.subscribedState = false
    }

    actionSetReady() {
        this.ready = true
    }

    actionSetLastTxid(txid: string) {
        this.lastTxid = txid

        log.debug(`SAT103: Send Coins TxID: ${this.lastTxid}`)
    }

    actionSetState(state: WalletState) {
        if (state != this.state) {
            log.debug(`SAT051: State: ${state}`, true)
            this.state = state
        }
    }

    actionSubscribeState() {
        if (!this.subscribedState) {
            lnd.subscribeState((data) => this.subscribeStateResponse(data))
            this.subscribedState = true
        }
    }

    actionUpdateWalletBalance(
        totalBalance: number,
        confirmedBalance: number,
        unconfirmedBalance: number,
        lockedBalance: number,
        reservedBalance: number
    ) {
        this.totalBalance = totalBalance
        this.confirmedBalance = confirmedBalance
        this.unconfirmedBalance = unconfirmedBalance
        this.lockedBalance = lockedBalance
        this.reservedBalance = reservedBalance

        log.debug(
            `SAT102: Wallet Balance: total ${this.totalBalance}, ` +
                `confirmed ${this.totalBalance}, unconfirmed ${this.totalBalance}, ` +
                `locked ${this.totalBalance}, reserved ${this.totalBalance}`
        )
    }

    async reactionBackend() {
        if (!this.stores.uiStore.hasOnboardingUpdates) {
            if (this.stores.lightningStore.backend === LightningBackend.BREEZ_SDK) {
                // Check the securely stored data and set state
                const seedMnemonic: string = await getSecureItem(SECURE_KEY_BREEZ_SDK_SEED_MNEMONIC)
                const deviceKey: Uint8Array = await getSecureItem(SECURE_KEY_GREENLIGHT_DEVICE_KEY_STORE)

                this.actionSetState(!seedMnemonic || !deviceKey ? WalletState.NON_EXISTING : WalletState.LOCKED)
            } else if (this.stores.lightningStore.backend === LightningBackend.LND) {
                // Start lnd and wait for state changes
                await lnd.start()

                this.actionSubscribeState()
            }
        }
    }

    async reactionState() {
        if (this.state === WalletState.NON_EXISTING) {
            this.createWallet()
        } else if (this.state === WalletState.LOCKED) {
            this.unlockWallet()
        }
    }

    async reactionSyncedToChain() {
        if (this.stores.lightningStore.syncedToChain) {
            this.refreshWalletBalance()
        }
    }
}
