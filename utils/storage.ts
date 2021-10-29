import AsyncStorage from "@react-native-async-storage/async-storage"
import SecureStorage from "react-native-secure-storage"
import { Log } from "utils/logging"

const log = new Log("Storage")

const secureConfig = {}

export const setItem = async (key: string, item: any): Promise<void> => {
    return await AsyncStorage.setItem(key, JSON.stringify(item))
}

export const getItem = async (key: string): Promise<any | null> => {
    const item = await AsyncStorage.getItem(key)
    return item && JSON.parse(item)
}

export const setSecureItem = async (key: string, item: any): Promise<void> => {
    return await SecureStorage.setItem(key, JSON.stringify(item), secureConfig)
}

export const getSecureItem = async (key: string): Promise<any | null> => {
    const item = await SecureStorage.getItem(key, secureConfig)
    return item && JSON.parse(item)
}
