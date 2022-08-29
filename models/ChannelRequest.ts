interface ChannelRequestModel {
    pubkey: string
    paymentHash: string
    pendingChanId: string
}

type ChannelRequestModelLike = ChannelRequestModel | undefined

export default ChannelRequestModel
export type { ChannelRequestModelLike }
