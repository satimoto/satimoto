interface ChannelModel {
    isActive: boolean
    isClosed: boolean
    chanId: string
    remotePubkey: string
    channelPoint: string
    capacity: number
    closingTxid?: string
}

type ChannelModelLike = ChannelModel | undefined

export default ChannelModel
export type { ChannelModelLike }
