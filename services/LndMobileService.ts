import { NativeModules, NativeEventEmitter } from "react-native"
import { Duplex } from "stream"
import { bytesToBase64, base64ToBytes } from "byte-base64"
import * as protobuf from "protobufjs"
import { Log } from "utils/logging"

const log = new Log("LndMobile")
const { LndMobile } = NativeModules

export const LndMobileEventEmitter = new NativeEventEmitter(LndMobile)

/**
 * Send & Stream Request/Response Interfaces
 */

export interface ISendRequest<IRequest, Request> {
    create: (options: IRequest) => Request
    encode: (request: Request) => protobuf.Writer
}

export interface ISendResponse<Response> {
    decode: (reader: protobuf.Reader | Uint8Array) => Response
    toObject(message: Response, options?: protobuf.IConversionOptions): { [k: string]: any }
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

export const serializeRequest = <IRequest, Request>(request: ISendRequest<IRequest, Request>, options: IRequest): string => {
    const message = request.create(options)
    return bytesToBase64(request.encode(message).finish())
}

export const deserializeResponse = <Response>(response: ISendResponse<Response>, base64Data: any): Response => {
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
        write(data) {
            data = JSON.parse(data.toString("utf8"))
            const base64Command = serializeRequest(request, data)
            LndMobile.sendStreamWrite(streamId, base64Command)
        },
        read() {}
    })
    LndMobileEventEmitter.addListener("streamEvent", (event) => {
        if (event.streamId === streamId) {
            log.debugTime(`${method} Response <${streamId}: ${event.event}>`, requestTime)
            if (event.event === "data") {
                const data = deserializeResponse(response, event.data)
                log.debug(JSON.stringify(data, null, 2))
                stream.emit(event.event, data)
            } else {
                log.debug(JSON.stringify(event.error || event.data, null, 2))
                stream.emit(event.event, event.error || event.data)
            }
        }
    })
    const base64Command = serializeRequest(request, options)
    LndMobile.sendStreamCommand(method, streamId, base64Command)
    return stream
}

export const decodeStreamResult = <Response>({ base64Result, response }: IStreamResult<Response>): Response => {
    return response.decode(base64ToBytes(base64Result))
}
