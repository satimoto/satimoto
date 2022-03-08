import ConnectorModel from "models/Connector"

interface LocationModel {
    uuid: string
    name: string
    address: string
    city: string
    postalCode: string
    connectors: ConnectorModel[]
}

type LocationModelLike = LocationModel | undefined

export default LocationModel
export type { LocationModelLike }
