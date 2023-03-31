import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import PaymentModel, { PaymentModelLike } from "models/Payment"
import * as breezSdk from "react-native-breez-sdk"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { lnrpc } from "proto/proto"
import { StoreInterface, Store } from "stores/Store"
import * as lightning from "services/lightning"
import * as lnd from "services/lnd"
import * as lnUrl from "services/lnUrl"
import { LightningBackend } from "types/lightningBackend"
import { fromBreezPayment, fromLndPayment, PaymentStatus } from "types/payment"
import { assertNetwork } from "utils/assert"
import { DEBUG } from "utils/build"
import { bytesToHex, deepCopy, toHash, toMilliSatoshi, toNumber } from "utils/conversion"
import I18n from "utils/i18n"
import { Log } from "utils/logging"

const log = new Log("PaymentStore")

export interface PaymentStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    indexOffset: string
    payments: PaymentModel[]

    findPayment(hash: string): PaymentModelLike
    payLnurl(payParams: breezSdk.LnUrlPayRequestData, amountSats: number): Promise<boolean>
    sendPayment(bolt11: string): Promise<PaymentModel>
}

export class PaymentStore implements PaymentStoreInterface {
    hydrated = false
    ready = false
    stores

    indexOffset = "0"
    payments

    constructor(stores: Store) {
        this.stores = stores
        this.payments = observable<PaymentModel>([])

        makeObservable(this, {
            hydrated: observable,
            ready: observable,
            indexOffset: observable,
            payments: observable,

            actionSetReady: action,
            actionUpdatePayment: action,
            actionUpdateIndexOffset: action
        })

        makePersistable(
            this,
            { name: "PaymentStore", properties: ["indexOffset", "payments"], storage: AsyncStorage, debugMode: DEBUG },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    async initialize(): Promise<void> {
        try {
            // When the synced to chain, list missed payments
            when(
                () => this.stores.lightningStore.syncedToChain,
                () => this.whenSyncedToChain()
            )
        } catch (error) {
            log.error(`SAT056: Error Initializing: ${error}`, true)
        }
    }

    findPayment(hash: string): PaymentModelLike {
        return this.payments.find((payment) => payment.hash === hash)
    }

    async payLnurl(payParams: breezSdk.LnUrlPayRequestData, amountSats: number): Promise<boolean> {
        if (this.stores.lightningStore.backend === LightningBackend.BREEZ_SDK) {
            const lnUrlPayResult = await breezSdk.payLnurl(deepCopy(payParams), amountSats)

            if (lnUrlPayResult.type === breezSdk.LnUrlPayResultType.ENDPOINT_ERROR) {
                const lnUrlErrorData = lnUrlPayResult.data as breezSdk.LnUrlErrorData

                throw Error(lnUrlErrorData.reason)
            }

            return true
        } else if (this.stores.lightningStore.backend === LightningBackend.LND) {
            const amountMsats = toNumber(toMilliSatoshi(amountSats))
            const payResponse = await lnUrl.payRequest(payParams.callback, amountMsats.toString())

            assertNetwork(payResponse.pr)

            const lnInvoice = await lightning.parseInvoice(payResponse.pr)
            const metadataHash = bytesToHex(toHash(payParams.metadataStr))
            log.debug(`SAT008 Metadata hash: ${metadataHash}`)
            log.debug(`SAT008 Payment Request hash: ${lnInvoice.descriptionHash}`)

            // Verify metadata hash with description hash and invoice value
            if (lnInvoice.descriptionHash === metadataHash && !!lnInvoice.amountMsat && lnInvoice.amountMsat === amountMsats) {
                const payment = await this.sendPayment(payResponse.pr)

                if (payment.status === PaymentStatus.SUCCEEDED) {
                    return true
                } else if (payment.status === PaymentStatus.FAILED && payment.failureReasonKey) {
                    throw Error(I18n.t(payment.failureReasonKey))
                }
            }

            throw Error(I18n.t("LnUrlPay_PayReqError"))
        }

        throw Error("Not implemented")
    }

    reset() {
        this.actionResetPayments()
    }

    async sendPayment(bolt11: string, withReset: boolean = true, withEdgeUpdate: boolean = true): Promise<PaymentModel> {
        let payment = await lightning.sendPayment(this.stores.lightningStore.backend, bolt11, { withReset, withEdgeUpdate })
        return this.updatePayment(payment)
    }

    async updateBreezPayments(payments: breezSdk.Payment[]) {
        for (const payment of payments) {
            this.actionUpdatePayment(fromBreezPayment(payment))
            this.actionUpdateIndexOffset(payment.paymentTime.toString())
        }

        this.actionSetReady()
    }

    async updateLndPayments({ payments }: lnrpc.ListPaymentsResponse) {
        for (const iPayment of payments) {
            const payment = lnrpc.Payment.fromObject(iPayment)
            const paymentRequest = await breezSdk.parseInvoice(payment.paymentRequest)

            this.actionUpdatePayment(fromLndPayment(payment, paymentRequest))
            this.actionUpdateIndexOffset(payment.paymentIndex?.toString())
        }

        this.actionSetReady()
    }

    async updatePayment(payment: PaymentModel): Promise<PaymentModel> {
        return this.actionUpdatePayment(payment)
    }

    /*
     * Mobx actions and reactions
     */

    actionResetPayments() {
        this.indexOffset = "0"
        this.payments.clear()
    }

    actionSetReady() {
        this.ready = true
    }

    actionUpdateIndexOffset(indexOffset?: string) {
        if (indexOffset) {
            this.indexOffset = indexOffset
        }
    }

    actionUpdatePayment(payment: PaymentModel, forceUpdate: boolean = false): PaymentModel {
        let existingPayment = this.payments.find(({ hash }) => hash === payment.hash)

        if (existingPayment) {
            if (forceUpdate || existingPayment.status === PaymentStatus.IN_PROGRESS) {
                Object.assign(existingPayment, payment)
                this.stores.transactionStore.addTransaction({ hash: payment.hash, payment: existingPayment })

                if (existingPayment.status === PaymentStatus.SUCCEEDED) {
                    this.stores.channelStore.getChannelBalance()
                }
            }

            return existingPayment
        }

        this.payments.push(payment)
        this.stores.transactionStore.addTransaction({ hash: payment.hash, payment })

        if (payment.status === PaymentStatus.SUCCEEDED) {
            this.stores.channelStore.getChannelBalance()
        }

        return payment
    }

    async whenSyncedToChain() {
        if (this.stores.lightningStore.backend === LightningBackend.BREEZ_SDK) {
            const fromTimestamp = this.indexOffset !== "0" ? parseInt(this.indexOffset) : undefined
            const payments = await breezSdk.listPayments(breezSdk.PaymentTypeFilter.SENT, fromTimestamp)

            this.updateBreezPayments(payments)
        } else if (this.stores.lightningStore.backend === LightningBackend.LND) {
            const listPaymentsResponse: lnrpc.ListPaymentsResponse = await lnd.listPayments(true, this.indexOffset)

            this.updateLndPayments(listPaymentsResponse)
        }
    }
}
