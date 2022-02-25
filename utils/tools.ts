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

export const doWhile = async (name: string, action: ActionType, interval = INTERVAL_RETRY) => {
    return doWhileBackoff(name, action, interval, noBackoff)
}

export const doWhileBackoff = async (name: string, action: ActionType, interval = INTERVAL_RETRY, backoff: BackoffType = defaultBackoff) => {
    return doWhileBackoffUntil(name, action, interval, backoff, 0)
}

export const doWhileBackoffUntil = async (
    name: string,
    action: ActionType,
    interval = INTERVAL_RETRY,
    backoff: BackoffType = defaultBackoff,
    until: number = 0
) => {
    let backoffPeriod = interval
    let tries = 0

    while (true) {
        const response = await action()

        if (response) {
            return response
        }

        tries++

        if (until > 0 && tries == until) {
            throw new Error(`${name}: Tries exceeded`)
        }

        backoffPeriod = backoff(backoffPeriod)
        log.debug(`${name}: Backing off to ${backoffPeriod}ms`)
        await timeout(backoffPeriod)
    }
}
