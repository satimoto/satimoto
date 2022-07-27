interface ChannelRequestModel {
    pubkey: string
    paymentHash: string
    pushAmount: string
}

type ChannelRequestModelLike = ChannelRequestModel | undefined

export default ChannelRequestModel
export type { ChannelRequestModelLike }