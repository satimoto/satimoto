import { NativeEventEmitter, NativeModules } from "react-native"
import { LndUtils, LndUtilsEventEmitter } from "services/lnd/utils"
import { LightningBackend } from "types/lightningBackend"
import { Log } from "utils/logging"
import { DEBUG } from "utils/build"

const breezSdkLog = new Log("BreezSDK")
const log = new Log("Lightning")

const BreezSDK = NativeModules.RNBreezSDK
const BreezSDKEmitter = new NativeEventEmitter(BreezSDK)

export const startLogEvents = async (backend: LightningBackend): Promise<void> => {
    log.debug("SAT018: Start Log Events")

    if (backend === LightningBackend.BREEZ_SDK) {
        BreezSDKEmitter.addListener("breezSdkLog", (logEntry) => {
            breezSdkLog.debug(`[${logEntry.level}] ${logEntry.line}`, DEBUG)
        })
        await BreezSDK.startLogStream()
    } else if (backend === LightningBackend.LND) {
        LndUtilsEventEmitter.addListener("logEvent", (data) => {
            log.debug(data, DEBUG)
        })
        LndUtils.startLogEvents()
    }
}
