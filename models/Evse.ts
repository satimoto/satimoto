import LocationModel from "models/Location"
import ConnectorModel from "models/Connector"

interface EvseModel {
    uid: string
    identifier?: string
    status: string
    location?: LocationModel
    connectors: ConnectorModel[]
}

type EvseModelLike = EvseModel | undefined

export default EvseModel
export type { EvseModelLike }
