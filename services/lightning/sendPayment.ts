import { ChannelModel } from "models/Node"
import PaymentModel from "models/Payment"
import { lnrpc } from "proto/proto"
import * as breezSdk from "@breeztech/react-native-breez-sdk"
import { LightningBackend } from "types/lightningBackend"
import * as lnd from "services/lnd"
import { listChannels } from "services/satimoto"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"
import { fromBreezPayment, fromLndPayment } from "types/payment"

const log = new Log("Lightning")

type SendPaymentOptions = {
    amountSats?: number
    withReset?: boolean
    withEdgeUpdate?: boolean
}

export const sendPayment = async (
    backend: LightningBackend,
    bolt11: string,
    { amountSats, withReset = true, withEdgeUpdate = true }: SendPaymentOptions
): Promise<PaymentModel> => {
    if (backend === LightningBackend.BREEZ_SDK) {
        const paymentResponse = await breezSdk.sendPayment(bolt11, amountSats)

        return fromBreezPayment(paymentResponse, paymentResponse.details.data as breezSdk.LnPaymentDetails)
    } else if (backend === LightningBackend.LND) {
        const paymentResponse = await sendLndPayment({ paymentRequest: bolt11 }, { withReset, withEdgeUpdate })
        const paymentRequest = await breezSdk.parseInvoice(bolt11)

        return fromLndPayment(paymentResponse, paymentRequest)
    }

    throw Error("Not implemented")
}

const sendLndPayment = async (
    request: lnd.SendPaymentV2Props,
    { withReset = true, withEdgeUpdate = true }: SendPaymentOptions
): Promise<lnrpc.Payment> => {
    return new Promise<lnrpc.Payment>(async (resolve, reject) => {
        try {
            await lnd.sendPaymentV2(async (payment: lnrpc.Payment) => {
                if (payment.status === lnrpc.Payment.PaymentStatus.FAILED) {
                    const tryReset =
                    payment.failureReason === lnrpc.PaymentFailureReason.FAILURE_REASON_NO_ROUTE ||
                        payment.failureReason === lnrpc.PaymentFailureReason.FAILURE_REASON_INSUFFICIENT_BALANCE

                    if (tryReset) {
                        if (withReset) {
                            log.debug(`SAT057: Payment failure, resetting mission control`, true)
                            await lnd.resetMissionControl()
                            payment = await sendLndPayment(request, { withReset: false, withEdgeUpdate })
                        } else if (withEdgeUpdate) {
                            try {
                                log.debug(`SAT058: Payment failure, force edges update`, true)
                                const listChannelsResponse = await listChannels()
                                const channels = listChannelsResponse.data.listChannels as ChannelModel[]
                                const channelIds = channels.map((channel) => channel.channelId)
                                log.debug(`SAT059: Edges received: ${channelIds.length}`, true)

                                if (channelIds.length > 0) {
                                    await lnd.markEdgeLive(channelIds)

                                    payment = await sendLndPayment(request, { withReset: false, withEdgeUpdate: false })
                                }
                            } catch (error) {
                                log.error(`SAT060: Error updating edges: ${error}`, true)
                            }
                        } else if (DEBUG) {
                            await lnd.getNodeInfo("029e6289970aa5e57fe92bb8ae0cefa7ff388bb21a0f8277bc3a45fc5c10e98c4b", true)
                        }
                    }

                    resolve(payment)
                } else if (payment.status === lnrpc.Payment.PaymentStatus.SUCCEEDED) {
                    resolve(payment)
                }
            }, request)
        } catch (error) {
            reject(error)
        }
    })
}
