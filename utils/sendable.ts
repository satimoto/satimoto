import { encodeRequest, ISendRequest } from "services/lnd/mobile"
import { Duplex } from "stream"
import { Cancelable } from "utils/cancelable"

export interface Sendable<IRequest, Response> extends Cancelable<Response> {
    send(options: IRequest): Sendable<IRequest, Response>
}

const sendable = <IRequest, Request, Response>(
    request: ISendRequest<IRequest, Request>,
    stream: Duplex,
    cancelable: Cancelable<Response>
): Sendable<IRequest, Response> => {
    let sendable = <Sendable<IRequest, Response>>cancelable

    sendable.send = (options: IRequest): Sendable<IRequest, Response> => {
        stream.write(encodeRequest(request, options))

        return sendable
    }

    return sendable
}

export default sendable
