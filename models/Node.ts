interface NodeModel {
    pubkey: string
    addr: string
    alias?: string
}

type NodeModelLike = NodeModel | undefined

export default NodeModel
export type { NodeModelLike }

interface ChannelModel {
    channelId: string
}

export type { ChannelModel }
