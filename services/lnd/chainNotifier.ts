import { chainrpc } from "proto/proto"
import { sendStreamCommand, sendStreamResponse } from "services/lnd/mobile"
import { toBytesOrNull } from "utils/conversion"
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
            hash: toBytesOrNull(hash),
            height: height
        }
    })
    return sendStreamResponse<chainrpc.BlockEpoch>({ stream, method, onData })
}
