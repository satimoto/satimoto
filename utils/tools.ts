import cancelable, { Cancelable } from "utils/cancelable"
import { INTERVAL_RETRY } from "utils/constants"
import { Log } from "utils/logging"

const log = new Log("Tools")

type ActionType = () => any
type BackoffType = (interval: number) => number

const defaultBackoff = (interval: number) => {
    return interval + interval / 2
}

const noBackoff = (interval: number) => {
    return interval
}

export const timeout = (millis: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, millis))
}

export const doWhile = (name: string, action: ActionType, interval = INTERVAL_RETRY): Cancelable<any> => {
    return doWhileBackoff(name, action, interval, noBackoff)
}

export const doWhileBackoff = (
    name: string,
    action: ActionType,
    interval = INTERVAL_RETRY,
    backoff: BackoffType = defaultBackoff
): Cancelable<any> => {
    return doWhileBackoffUntil(name, action, interval, backoff, 0)
}

export const doWhileUntil = (name: string, action: ActionType, interval = INTERVAL_RETRY, until: number = 0): Cancelable<any> => {
    return doWhileBackoffUntil(name, action, interval, noBackoff, until)
}

export const doWhileBackoffUntil = (
    name: string,
    action: ActionType,
    interval = INTERVAL_RETRY,
    backoff: BackoffType = defaultBackoff,
    until: number = 0
): Cancelable<any> => {
    let isCancelled = false

    return cancelable(
        new Promise<any>(async (resolve, reject) => {
            let backoffPeriod = interval
            let tries = 0

            while (true) {
                if (isCancelled) {
                    break
                }

                const response = await action()

                if (response) {
                    return resolve(response)
                }

                tries++

                if (until > 0 && tries == until) {
                    return reject()
                }

                backoffPeriod = backoff(backoffPeriod)
                log.debug(`SAT100: ${name}: Backing off to ${backoffPeriod}ms`)
                await timeout(backoffPeriod)
            }
        }),
        () => {
            isCancelled = true
        }
    )
}
