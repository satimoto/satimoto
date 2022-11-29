import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import { ChannelModel } from "models/Node"
import PaymentModel from "models/Payment"
import moment from "moment"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { lnrpc } from "proto/proto"
import { StoreInterface, Store } from "stores/Store"
import { decodePayReq, getNodeInfo, listPayments, markEdgeLive, resetMissionControl, sendPaymentV2 } from "services/LightningService"
import { SendPaymentV2Props } from "services/LightningService"
import { listChannels } from "services/SatimotoService"
import { PaymentStatus, toPaymentStatus } from "types/payment"
import { DEBUG } from "utils/build"
import { nanosecondsToDate, toNumber } from "utils/conversion"
import { Log } from "utils/logging"

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
            updatePaymentWithPayReq: action,
            updateIndexOffset: action
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
            log.error(`Error Initializing: ${error}`)
        }
    }

    sendPayment(request: SendPaymentV2Props, withReset: boolean = true, withEdgeUpdate: boolean = true): Promise<PaymentModel> {
        return new Promise<PaymentModel>(async (resolve, reject) => {
            try {
                await sendPaymentV2(async (response: lnrpc.Payment) => {
                    let payment = await this.updatePayment(response)

                    if (payment.status === PaymentStatus.FAILED) {
                        const tryReset =
                            response.failureReason === lnrpc.PaymentFailureReason.FAILURE_REASON_NO_ROUTE ||
                            response.failureReason === lnrpc.PaymentFailureReason.FAILURE_REASON_INSUFFICIENT_BALANCE

                        if (tryReset) {
                            if (withReset) {
                                log.debug(`Payment failure, resetting mission control`)
                                await resetMissionControl()
                                payment = await this.sendPayment(request, false)
                            } else if (withEdgeUpdate) {
                                try {
                                    log.debug(`Payment failure, force edges update`)
                                    const listChannelsResponse = await listChannels()
                                    const channels = listChannelsResponse.data.listChannels as ChannelModel[]
                                    const channelIds = channels.map((channel) => channel.channelId)
                                    log.debug(`Edges received: ${channelIds.length}`)

                                    if (channelIds.length > 0) {
                                        await markEdgeLive(channelIds)

                                        payment = await this.sendPayment(request, false, false)
                                    }
                                } catch (error) {
                                    log.error(`Error updating edges: ${error}`)
                                }
                            } else if (DEBUG) {
                                await getNodeInfo('029e6289970aa5e57fe92bb8ae0cefa7ff388bb21a0f8277bc3a45fc5c10e98c4b', true)
                            }
                        }

                        resolve(payment)
                    } else if (payment.status === PaymentStatus.SUCCEEDED) {
                        this.stores.channelStore.getChannelBalance()

                        resolve(payment)
                    }
                }, request)
            } catch (error) {
                reject(error)
            }
        })
    }

    setReady() {
        this.ready = true
    }

    updateIndexOffset(payment: lnrpc.Payment) {
        this.indexOffset = payment.paymentIndex ? payment.paymentIndex.toString() : this.indexOffset
    }

    async updatePayment(payment: lnrpc.Payment): Promise<PaymentModel> {
        const decodedPaymentRequest = await decodePayReq(payment.paymentRequest)

        return this.updatePaymentWithPayReq(payment, decodedPaymentRequest)
    }

    updatePaymentWithPayReq(
        { creationTimeNs, feeMsat, feeSat, paymentHash, paymentPreimage, status, valueMsat, valueSat }: lnrpc.Payment,
        payReq: lnrpc.PayReq
    ): PaymentModel {
        let payment = this.payments.find(({ hash }) => hash === paymentHash)

        if (payment) {
            Object.assign(payment, {
                description: payReq.description,
                feeMsat: feeMsat.toString(),
                feeSat: feeSat.toString(),
                preimage: paymentPreimage,
                status: toPaymentStatus(status),
                valueMsat: valueMsat.toString(),
                valueSat: valueSat.toString()
            })
        } else {
            const createdAt = nanosecondsToDate(creationTimeNs)
            payment = {
                createdAt: createdAt.toISOString(),
                expiresAt: moment(createdAt).add(toNumber(payReq.expiry), "second").toISOString(),
                description: payReq.description,
                feeMsat: feeMsat.toString(),
                feeSat: feeSat.toString(),
                hash: paymentHash,
                preimage: paymentPreimage,
                status: toPaymentStatus(status),
                valueMsat: valueMsat.toString(),
                valueSat: valueSat.toString()
            }

            this.payments.push(payment)
        }

        this.stores.transactionStore.addTransaction({ hash: paymentHash, payment })

        return payment
    }

    async updatePayments({ payments }: lnrpc.ListPaymentsResponse) {
        for (const iPayment of payments) {
            const payment = lnrpc.Payment.fromObject(iPayment)
            const decodedPaymentRequest = await decodePayReq(payment.paymentRequest)

            this.updatePaymentWithPayReq(payment, decodedPaymentRequest)
            this.updateIndexOffset(payment)
        }

        this.setReady()
    }

    async whenSyncedToChain() {
        const listPaymentsResponse: lnrpc.ListPaymentsResponse = await listPayments(true, this.indexOffset)
        this.updatePayments(listPaymentsResponse)
    }
}
