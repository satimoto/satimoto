import Long from "long"
import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import PaymentModel, { PaymentModelLike } from "models/Payment"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { lnrpc } from "proto/proto"
import { StoreInterface, Store } from "stores/Store"
import { listPayments, sendPaymentV2 } from "services/LightningService"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"
import { nanosecondsToDate, toTransactionStatus } from "utils/conversion"
import { SendPaymentV2Props } from "services/LightningService"
import { TransactionStatus, TransactionType } from "types/transaction"

const log = new Log("PaymentStore")

export interface PaymentStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    indexOffset: string
    payments: PaymentModel[]

    sendPayment(payment: SendPaymentV2Props): Promise<PaymentModel>
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

            setReady: action,
            updatePayment: action,
            updatePayments: action
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
                () => this.postSync()
            )
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    async postSync() {
        const listPaymentsResponse: lnrpc.ListPaymentsResponse = await listPayments(true, this.indexOffset)
        this.updatePayments(listPaymentsResponse)
    }

    sendPayment(payment: SendPaymentV2Props, identifier?: string): Promise<PaymentModel> {
        return new Promise<PaymentModel>(async (resolve, reject) => {
            try {
                await sendPaymentV2((data: lnrpc.Payment) => {
                    const payment = this.updatePayment(data, identifier)

                    if (payment.status === TransactionStatus.FAILED || payment.status === TransactionStatus.SUCCEEDED) {
                        resolve(payment)
                    }
                }, payment)
            } catch (error) {
                reject(error)
            }
        })
    }

    setReady() {
        this.ready = true
    }

    updatePayment(
        { creationTimeNs, feeMsat, feeSat, paymentHash, paymentPreimage, status, valueMsat, valueSat }: lnrpc.Payment,
        identifier?: string
    ): PaymentModel {
        let payment: PaymentModelLike = this.payments.find(({ hash }) => hash === paymentHash)

        if (payment) {
            payment.feeMsat = feeMsat.toString()
            payment.feeSat = feeSat.toString()
            payment.preimage = paymentPreimage
            payment.status = toTransactionStatus(status)
            payment.valueMsat = valueMsat.toString()
            payment.valueSat = valueSat.toString()
        } else {
            payment = {
                createdAt: nanosecondsToDate(creationTimeNs).toISOString(),
                feeMsat: feeMsat.toString(),
                feeSat: feeSat.toString(),
                hash: paymentHash,
                preimage: paymentPreimage,
                status: toTransactionStatus(status),
                type: TransactionType.PAYMENT,
                valueMsat: valueMsat.toString(),
                valueSat: valueSat.toString()
            }

            this.payments.push(payment)
        }

        if (payment.status === TransactionStatus.SUCCEEDED) {
            this.stores.transactionStore.addTransaction(payment, identifier)
        }

        return payment
    }

    updatePayments({ payments }: lnrpc.ListPaymentsResponse) {
        payments.forEach((payment) => {
            this.updatePayment(lnrpc.Payment.fromObject(payment))

            this.indexOffset = payment.paymentIndex ? payment.paymentIndex.toString() : this.indexOffset
        }, this)

        this.setReady()
    }
}
