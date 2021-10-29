import { Platform } from "react-native"
import BuildConfig from "react-native-build-config"

export const Debug: boolean = Platform.select({
    android: BuildConfig.DEBUG,
    ios: BuildConfig.DEBUG === "true"
})

export const Network: string = BuildConfig.Network
