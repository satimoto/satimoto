import ConnectorModel from "models/Connector"

interface EvseModel {
    uid: string
    status: string
    connectors: ConnectorModel[]
}

type EvseModelLike = EvseModel | undefined

export default EvseModel
export type { EvseModelLike }
