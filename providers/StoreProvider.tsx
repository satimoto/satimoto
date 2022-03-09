import React, { createContext, PropsWithChildren } from "react"
import { Store } from "stores/Store"

export const StoreContext = createContext<Store>({} as Store)

export interface StoreProviderProps extends PropsWithChildren<any> {
    store: Store
}

export const StoreProvider = ({ children, store }: StoreProviderProps) => {
    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}
