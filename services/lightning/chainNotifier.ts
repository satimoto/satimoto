import { chainrpc } from "proto/proto"
import { sendStreamCommand, processStreamResponse } from "services/LndMobileService"
import { toBytes } from "utils/conversion"
import { Log } from "utils/logging"
import { BytesLikeType } from "utils/types"

const log = new Log("Chain")
const service = "ChainNotifier"

export type BlockEpochStreamResponse = (data: chainrpc.BlockEpoch) => void

export const registerBlockEpochNtfn = (onData: BlockEpochStreamResponse, hash?: BytesLikeType, height?: number): Promise<chainrpc.BlockEpoch> => {
    const method = service + "RegisterBlockEpochNtfn"
    const stream = sendStreamCommand<chainrpc.IBlockEpoch, chainrpc.BlockEpoch, chainrpc.BlockEpoch>({
        request: chainrpc.BlockEpoch,
        response: chainrpc.BlockEpoch,
        method,
        options: {
            hash: toBytes(hash),
            height: height
        }
    })
    return processStreamResponse<chainrpc.BlockEpoch>({ stream, method, onData })
}
