import Long from "long"
import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { lnrpc } from "proto/proto"
import { IStore, Store } from "stores/Store"
import { listPayments } from "services/LightningService"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"

const log = new Log("PaymentStore")

export interface IPaymentType {
    creationTimeNs?: string | null
    failureReason?: lnrpc.PaymentFailureReason | null
    feeSat?: string | null
    paymentHash?: string | null
    paymentPreimage?: string | null
    paymentRequest?: string | null
    valueSat?: string | null
}

export interface IPaymentStore extends IStore {
    hydrated: boolean
    stores: Store

    indexOffset: string
    payments: IPaymentType[]

    listPayments(): Promise<void>
    updatePayments(data: lnrpc.ListPaymentsResponse): void
}

export class PaymentStore implements IPaymentStore {
    hydrated = false
    ready = false
    stores

    indexOffset = "0"
    payments

    constructor(stores: Store) {
        this.stores = stores
        this.payments = new Array<IPaymentType>()

        makeObservable(this, {
            hydrated: observable,
            ready: observable,
            indexOffset: observable,
            payments: observable,

            setReady: action,
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
                () => this.listPayments()
            )
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    async listPayments() {
        const listPaymentsResponse: lnrpc.ListPaymentsResponse = await listPayments(true, Long.fromValue(this.indexOffset))
        this.updatePayments(listPaymentsResponse)
    }

    async sendPayment() {
    }

    setReady() {
        this.ready = true
    }

    updatePayments({ payments }: lnrpc.ListPaymentsResponse) {
        payments.forEach(({ creationTimeNs, failureReason, feeSat, paymentHash, paymentIndex, paymentPreimage, paymentRequest, valueSat }) => {
            this.payments.push({
                creationTimeNs: creationTimeNs && creationTimeNs.toString(),
                failureReason,
                feeSat: feeSat && feeSat.toString(),
                paymentHash,
                paymentPreimage,
                paymentRequest,
                valueSat: valueSat && valueSat.toString()
            })

            this.indexOffset = paymentIndex ? paymentIndex.toString() : this.indexOffset
        })

        this.setReady()
    }
}
