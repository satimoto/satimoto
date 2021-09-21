import Long from "long"
import { lnrpc } from "proto/proto"
import { sendStreamCommand } from "services/LndMobileService"
import { store } from "stores/Store"
import { Log } from "utils/logging"

const log = new Log("Channel")

export const openChannel = async (pubkey: string, amount: number, privateChannel: boolean = false): Promise<lnrpc.OpenStatusUpdate> => {
    const stream = sendStreamCommand<lnrpc.IOpenChannelRequest, lnrpc.OpenChannelRequest, lnrpc.OpenStatusUpdate>({
        request: lnrpc.OpenChannelRequest,
        response: lnrpc.OpenStatusUpdate,
        method: "OpenChannel",
        options: {
            nodePubkeyString: pubkey,
            localFundingAmount: Long.fromValue(amount),
            private: privateChannel
        }
    })
    const response = await new Promise<lnrpc.OpenStatusUpdate>((resolve, reject) => {
        stream.on("data", () => store.lightningStore.updateChannels())
        stream.on("end", resolve)
        stream.on("error", reject)
        stream.on("status", (status) => log.info(`Opening channel: ${status}`))
    })
    return response
}
