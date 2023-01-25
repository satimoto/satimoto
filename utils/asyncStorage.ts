
import { Log } from "utils/logging"
import { StorageController } from "mobx-persist-store"
import AsyncStorage from "@react-native-async-storage/async-storage"

const log = new Log("AsyncStorage")

export type ComplexAsyncStorageHydrationMap = {
    [key: string]: (value: any) => any
}

export const ComplexAsyncStorage = (get: ComplexAsyncStorageHydrationMap, set: ComplexAsyncStorageHydrationMap = {}): StorageController => {
    const reviver = (key: string, value: any): any => {
        if (key.length == 0) return value

        if (get[key]) {
            return get[key](value)
        }

        return value
    }

    const replacer = (key: string, value: any): any => {
        if (set[key]) {
            return set[key](value)
        }

        return value
    }

    return {
        getItem: async (key: string): Promise<any | null> => {
            const item = await AsyncStorage.getItem(key)
            return item ? JSON.parse(item, reviver) : null
        },
        setItem: async (key: string, value: any): Promise<void> => {
            const item = JSON.stringify(value, replacer)
            return AsyncStorage.setItem(key, item)
        },
        removeItem: AsyncStorage.removeItem
    }
}
