import { Platform } from "react-native"

export const INTERVAL_RETRY = 1000
export const IS_ANDROID = Platform.OS === "android"
export const IS_IOS = Platform.OS === "ios"

export const PAYMENT_TIMEOUT_SECONDS = 60
export const PAYMENT_FEE_LIMIT_SAT = 50000
export const PAYMENT_CLTV_LIMIT = 0

export const RECOVERY_WINDOW_DEFAULT = 250

export const SECURE_KEY_CIPHER_SEED_MNEMONIC = "CIPHER_SEED_MNEMONIC"
export const SECURE_KEY_WALLET_PASSWORD = "WALLET_PASSWORD"
