import { IConversionOptions, Reader, Writer } from "protobufjs"
import { NativeModules, NativeEventEmitter } from "react-native"
import { Duplex } from "stream"
import cancelable, { Cancelable } from "utils/cancelable"
import sendable, { Sendable } from "utils/sendable"
import { DEBUG } from "utils/build"
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

export const encodeRequest = <IRequest, Request>(request: ISendRequest<IRequest, Request>, options: IRequest): Uint8Array => {
    const message = request.create(options)
    return request.encode(message).finish()
}

export const serializeRequest = <IRequest, Request>(request: ISendRequest<IRequest, Request>, options: IRequest): string => {
    return bytesToBase64(encodeRequest(request, options))
}

export const deserializeResponse = <Response>(response: ISendResponse<Response>, base64Data: any): Response => {
    if (DEBUG) {
        log.debug(`SAT012 deserializeResponse: ${JSON.stringify(base64Data)}`)
    }

    return response.decode(base64ToBytes(base64Data.data || ""))
}

export const sendCommand = async <IRequest, Request, Response>({
    request,
    response,
    method,
    options
}: ISyncCommand<IRequest, Request, Response>): Promise<Response> => {
    const requestTime = log.debugTime(`SAT013: ${method} Request`)
    try {
        const base64Command = serializeRequest(request, options)
        const base64Response = await LndMobile.sendCommand(method, base64Command)
        const data = deserializeResponse(response, base64Response)

        log.debugTime(`SAT013: ${method} Response`, requestTime)

        if (DEBUG) {
            log.debug(JSON.stringify(data, null, 2))
        }

        return data
    } catch (err) {
        log.debugTime(`SAT014: ${method} Response Error`, requestTime, true)

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
    const requestTime = log.debugTime(`SAT015: ${method} Request <${streamId}>`)
    const stream = new Duplex({
        destroy() {
            log.debug(`SAT015: ${method} Destroy <${streamId}>`)
            LndMobile.closeStream(streamId)
            listener.remove()
        },
        read() {},
        write(data) {
            const base64Command = bytesToBase64(data)
            LndMobile.sendStreamWrite(streamId, base64Command)
        }
    })
    const listener = LndMobileEventEmitter.addListener("streamEvent", (event) => {
        if (event.streamId === streamId) {
            log.debugTime(`SAT015: ${method} Response <${streamId}: ${event.type}>`, requestTime)
            let data = event.error || event.data

            if (event.type === "data") {
                data = deserializeResponse(response, event)
            } else if (event.type === "error" || event.type === "end") {
                log.debug(`SAT016: ${method} Error <${streamId}: ${event.type}>`)
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

export const sendStreamResponse = <Response>({ stream, method, onData }: IStreamResponse<Response>): Cancelable<Response> => {
    const response = cancelable(
        new Promise<Response>((resolve, reject) => {
            stream.on("data", onData)
            stream.on("end", (response: Response) => {
                log.debug(`SAT017: Stream End ${method}`)
                resolve(response)
            })
            stream.on("error", (err) => {
                log.debug(`SAT017: Stream Error ${method}: ${err}`)
                reject(err)
            })
            stream.on("status", (status) => log.info(`SAT017: ${method}: ${status}`))
        }),
        (canceled) => {
            stream.destroy()
        }
    )
    return response
}

export const bidirectionalStreamRequest = <IRequest, Request, Response>(
    request: ISendRequest<IRequest, Request>,
    stream: Duplex,
    cancelable: Cancelable<Response>
): Sendable<IRequest, Response> => {
    const response = sendable(request, stream, cancelable)
    return response
}
