export class Log {
    tag = ""

    constructor(tag: string) {
        this.tag = tag
    }

    debug(message: string) {
        console.debug(`${this.tag}: ${message}`)
    }

    debugTime(message: string, startTime?: Date) {
        const stopTime = new Date()
        console.debug(this.tag + (startTime ? ` [${stopTime.valueOf() - startTime.valueOf()}ms]` : '') + `: ${message}`)

        return stopTime
    }

    info(message: string) {
        console.info(`${this.tag}: ${message}`)
    }

    error(message: string) {
        console.error(`${this.tag}: ${message}`)
    }

    warn(message: string) {
        console.warn(`${this.tag}: ${message}`)
    }
}
