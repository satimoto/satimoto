import { Platform } from "react-native"
import BuildConfig from "react-native-build-config"

export const DEBUG: boolean = Platform.select({
    android: BuildConfig.DEBUG,
    ios: BuildConfig.DEBUG === "true"
})

export const NETWORK: string = BuildConfig.NETWORK

export const API_URI: string = BuildConfig.API_URI
