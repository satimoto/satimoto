import { NativeModules, NativeEventEmitter } from "react-native"
import { Log } from "utils/logging"

const log = new Log("LndUtils")
const { LndUtils } = NativeModules

export const LndUtilsEventEmitter = new NativeEventEmitter(LndUtils)

export const writeConf = async (contents: String): Promise<any> => {
    await LndUtils.writeConf(contents)
}

export const writeDefaultConf = async (): Promise<any> => {
    await LndUtils.writeDefaultConf()
}

export const startLogEvents = (): void => {
    log.debug("Start Log Events")
    LndUtilsEventEmitter.addListener("logEvent", (data) => {
        log.debug(data)
    })
    LndUtils.startLogEvents()
}