import { Platform } from "react-native"
import { NETWORK } from "utils/build"

export const EMAIL_REGEX: RegExp = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

export const CUSTOMMESSAGE_CHANNELREQUEST_RECEIVE_CHAN_ID = 51727
export const CUSTOMMESSAGE_CHANNELREQUEST_SEND_PREIMAGE = 51728

export const INTERVAL_RETRY = 1000
export const INTERVAL_MINUTE = 60000
export const IS_ANDROID = Platform.OS === "android"
export const IS_IOS = Platform.OS === "ios"

export const INVOICE_REQUEST_UPDATE_INTERVAL = 3600
export const SESSION_INVOICE_UPDATE_INTERVAL = 600
export const LOCATION_UPDATE_INTERVAL = 60

export const LN_BECH32_PREFIX = NETWORK === "mainnet" ? "lnbc" : NETWORK === "testnet" ? "lntb" : "lnbcrt"
export const LNURL_CANONICAL_PHRASE =
    "DO NOT EVER SIGN THIS TEXT WITH YOUR PRIVATE KEYS! IT IS ONLY USED FOR DERIVATION OF LNURL-AUTH HASHING-KEY, DISCLOSING ITS SIGNATURE WILL COMPROMISE YOUR LNURL-AUTH IDENTITY AND MAY LEAD TO LOSS OF FUNDS!"

export const MINIMUM_REMOTE_CHARGE_BALANCE = 6000
export const MINIMUM_RFID_CHARGE_BALANCE = 60000

export const ONBOARDING_VERSION = "0.3.0"

export const INVOICE_EXPIRY = 3600
export const PAYMENT_TIMEOUT_SECONDS = 120
export const PAYMENT_FEE_LIMIT_SAT = 50000
export const PAYMENT_CLTV_LIMIT = 0

export const RECOVERY_WINDOW_DEFAULT = 250

export const SECURE_KEY_CIPHER_SEED_MNEMONIC = "CIPHER_SEED_MNEMONIC"
export const SECURE_KEY_WALLET_PASSWORD = "WALLET_PASSWORD"

