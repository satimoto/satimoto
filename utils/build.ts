import { Platform } from "react-native"
import BuildConfig from "react-native-build-config"
import { base64ToBytes } from "utils/conversion"

export const APPLICATION_ID: string = BuildConfig.APPLICATION_ID || "com.satimoto"

export const VERSION_NAME: string = BuildConfig.VERSION_NAME

export const VERSION_CODE: string = BuildConfig.VERSION_CODE

export const DEBUG: boolean = Platform.select({
    android: BuildConfig.DEBUG,
    ios: BuildConfig.DEBUG === "true"
})

export const NETWORK: string = BuildConfig.NETWORK

export const API_URI: string = BuildConfig.API_URI

export const BREEZ_SDK_API_KEY: string = BuildConfig.BREEZ_SDK_API_KEY

export const GREENLIGHT_PARTNER_CERT: Uint8Array = base64ToBytes(BuildConfig.GREENLIGHT_PARTNER_CERT)

export const GREENLIGHT_PARTNER_KEY: Uint8Array = base64ToBytes(BuildConfig.GREENLIGHT_PARTNER_KEY)

export const MAPBOX_API_KEY: string = BuildConfig.MAPBOX_API_KEY
