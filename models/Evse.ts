import ConnectorModel from "models/Connector"
import { EvseCapability } from "types/evse"
import LocationModel from "models/Location"
import TextDescriptionModel from "models/TextDescription"

interface EvseModel {
    uid: string
    evseId?: string
    identifier?: string
    status: string
    location?: LocationModel
    connectors: ConnectorModel[]
    capabilities: TextDescriptionModel[]
}

type EvseModelLike = EvseModel | undefined

export default EvseModel
export type { EvseModelLike }

const hasEvseCapability = (capabilities: TextDescriptionModel[], capability: EvseCapability): boolean => {
    const textDescription = capabilities.find((textDescription) => textDescription.text === capability)

    return !!textDescription
}

export { hasEvseCapability }