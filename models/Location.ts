import Connector from "models/Connector"

interface Location {
    uuid: string
    name: string
    address: string
    city: string
    postalCode: string
    connectors: Connector[]
}

type LocationLike = Location | undefined

export default Location
export type { LocationLike }
