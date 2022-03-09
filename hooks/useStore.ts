import { StoreContext } from "providers/StoreProvider"
import { useContext } from "react"
import { Store } from "stores/Store"

export const useStore = (): Store => {
    return useContext(StoreContext)
}
