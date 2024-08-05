import AsyncStorage from "@react-native-async-storage/async-storage"
import SecureStorage from "react-native-secure-storage"
import { StringifyQuery } from "url-parse"
import { Log } from "utils/logging"

const log = new Log("Storage")

export const getItem = async (key: string): Promise<any | null> => {
    const item = await AsyncStorage.getItem(key)
    return item && JSON.parse(item)
}

export const removeItem = async (key: string): Promise<void> => {
    return await AsyncStorage.removeItem(key)
}

export const setItem = async (key: string, item: any): Promise<void> => {
    return await AsyncStorage.setItem(key, JSON.stringify(item))
}

export const clearSecureItems = async (options: any = {}): Promise<void> => {
    const keys = await SecureStorage.getAllKeys()

    for await (const key of keys) {
        await SecureStorage.removeItem(key, options)
    }
}

export const getSecureItem = async (key: string, options: any = {}): Promise<any | null> => {
    log.debug(`SAT118: Getting key: ${key} group: ${options.accessGroup}`)
    let item = await SecureStorage.getItem(key, options)

    if (item == null && options.accessGroup != null) {
        log.debug(`SAT119: Failed to get key: ${key} group: ${options.accessGroup}`)
        item = await SecureStorage.getItem(key, { ...options, accessGroup: null })
    }

    if (item && item.indexOf("\"") !== -1) {
        log.debug(`SAT120: Parse item`)
        item = JSON.parse(item)
    }

    if (item && options.accessGroup != null) {
        try {
            log.debug(`SAT120: Migrating key: ${key} group: ${options.accessGroup}`)
            await SecureStorage.setItem(key, typeof item === "string" ? item : JSON.stringify(item), options)
        } catch (err) {
            log.error(`SAT121: Error migrating key: ${key} error: ${err}`)
        }
    }

    return item
}

export const removeSecureItem = async (key: string, options: any = {}): Promise<void> => {
    return await SecureStorage.removeItem(key, options)
}

export const setSecureItem = async (key: string, item: any, options: any = {}): Promise<void> => {
    log.debug(`SAT122: Setting key: ${key} group: ${options.accessGroup}`)
    return await SecureStorage.setItem(key, typeof item === "string" ? item : JSON.stringify(item), options)
}
