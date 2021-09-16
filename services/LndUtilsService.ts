import { NativeModules, NativeEventEmitter } from "react-native"

const { LndUtils } = NativeModules

export const LndUtilsEventEmitter = new NativeEventEmitter(LndUtils)

export const writeConf = async (contents: String): Promise<any> => {
    await LndUtils.writeConf(contents)
}

export const writeDefaultConf = async (): Promise<any> => {
    await LndUtils.writeDefaultConf()
}

export const startLogEvents = (): void => {
    LndUtils.startLogEvents()
}