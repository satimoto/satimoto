import { IConversionOptions, Reader, Writer } from "protobufjs"
import { NativeModules, NativeEventEmitter } from "react-native"
import { Duplex } from "stream"
import { base64ToBytes, bytesToBase64 } from "utils/conversion"
import { Log } from "utils/logging"

const log = new Log("LndMobile")
const { LndMobile } = NativeModules

export const LndMobileEventEmitter = new NativeEventEmitter(LndMobile)

/**
 * Send & Stream Request/Response Interfaces
 */

export interface ISendRequest<IRequest, Request> {
    create: (options: IRequest) => Request
    encode: (request: Request) => Writer
}

export interface ISendResponse<Response> {
    decode: (reader: Reader | Uint8Array) => Response
    toObject(message: Response, options?: IConversionOptions): { [k: string]: any }
}

export interface ISyncCommand<IRequest, Request, Response> {
    request: ISendRequest<IRequest, Request>
    response: ISendResponse<Response>
    method: string
    options: IRequest
}

export interface IStreamCommand<IRequest, Request, Response> {
    request: ISendRequest<IRequest, Request>
    response: ISendResponse<Response>
    method: string
    options: IRequest
}

export interface IStreamResult<Response> {
    base64Result: string
    response: ISendResponse<Response>
}

export interface IStreamResponse<Response> {
    stream: Duplex
    method: string
    onData: (data: Response) => void
}

export const serializeRequest = <IRequest, Request>(request: ISendRequest<IRequest, Request>, options: IRequest): string => {
    const message = request.create(options)
    return bytesToBase64(request.encode(message).finish())
}

export const deserializeResponse = <Response>(response: ISendResponse<Response>, base64Data: any): Response => {
    log.debug(`Data: ${JSON.stringify(base64Data)}`)
    return response.decode(base64ToBytes(base64Data.data || ""))
}

export const sendCommand = async <IRequest, Request, Response>({
    request,
    response,
    method,
    options
}: ISyncCommand<IRequest, Request, Response>): Promise<Response> => {
    const requestTime = log.debugTime(`${method} Request`)
    try {
        const base64Command = serializeRequest(request, options)
        const base64Response = await LndMobile.sendCommand(method, base64Command)
        const data = deserializeResponse(response, base64Response)
        log.debugTime(`${method} Response`, requestTime)
        log.debug(JSON.stringify(data, null, 2))
        return data
    } catch (err) {
        log.debugTime(`${method} Response Error`, requestTime)
        if (typeof err === "string") {
            throw new Error(err)
        } else {
            throw err
        }
    }
}

export const getStreamId = (): string => {
    return String(Date.now().valueOf())
}

export const sendStreamCommand = <IRequest, Request, Response>({
    request,
    response,
    method,
    options
}: IStreamCommand<IRequest, Request, Response>): Duplex => {
    const streamId = getStreamId()
    const requestTime = log.debugTime(`${method} Request <${streamId}>`)
    const stream = new Duplex({
        destroy() {
            listener.remove()
        },
        read() {},
        write(data) {
            data = JSON.parse(data.toString("utf8"))
            const base64Command = serializeRequest(request, data)
            LndMobile.sendStreamWrite(streamId, base64Command)
        }
    })
    const listener = LndMobileEventEmitter.addListener("streamEvent", (event) => {
        if (event.streamId === streamId) {
            log.debugTime(`${method} Response <${streamId}: ${event.type}>`, requestTime)
            let data = event.error || event.data

            if (event.type === "data") {
                data = deserializeResponse(response, event)
            } else if (event.type === "error" || event.type === "end") {
                listener.remove()
            }

            log.debug(JSON.stringify(data, null, 2))
            stream.emit(event.type, data)
        }
    })
    const base64Command = serializeRequest(request, options)
    LndMobile.sendStreamCommand(method, streamId, base64Command)
    return stream
}

export const processStreamResponse = <Response>({ stream, method, onData }: IStreamResponse<Response>): Promise<Response> => {
    const response = new Promise<Response>((resolve, reject) => {
        stream.on("data", onData)
        stream.on("end", resolve)
        stream.on("error", reject)
        stream.on("status", (status) => log.info(`${method}: ${status}`))
    })
    return response
}
