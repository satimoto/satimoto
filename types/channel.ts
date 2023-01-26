import { lnrpc } from "proto/proto"
import { isValue } from "utils/null"

type ChannelModelUpdate = {
    fundingTxid?: string
    outputIndex?: number
    channelPoint?: string
    isActive?: boolean
    isClosed?: boolean
    closingTxid?: string
}

export type { ChannelModelUpdate }

const toChannel = (channel: lnrpc.IChannel) => {
    let response: any = {}

    if (typeof channel.active == "boolean") {
        response["isActive"] = channel.active
    }

    if (isValue(channel.chanId)) {
        response["chanId"] = channel.chanId!.toString()
    }

    if (typeof channel.remotePubkey == "string") {
        response["remotePubkey"] = channel.remotePubkey
    }

    if (typeof channel.channelPoint == "string") {
        response["channelPoint"] = channel.channelPoint
    }

    if (typeof channel.capacity == "number") {
        response["capacity"] = channel.capacity
    }

    return response
}

const toChannelPoint = (channelPoint: string): lnrpc.IChannelPoint | null => {
    const splitChannelPoint = channelPoint.split(":")

    return splitChannelPoint.length == 2
        ? {
              fundingTxidStr: splitChannelPoint[0],
              outputIndex: parseInt(splitChannelPoint[1])
          }
        : null
}

export { toChannel, toChannelPoint }
