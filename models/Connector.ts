import EvseModel from "./Evse"
import TariffModel from "./Tariff"

interface ConnectorModel {
    uid: string
    identifier?: string
    standard: string
    format: string
    powerType: string
    voltage: number
    amperage: number
    wattage: number
    tariff?: TariffModel 
}

type ConnectorModelLike = ConnectorModel | undefined

export default ConnectorModel
export type { ConnectorModelLike }

interface ConnectorGroup extends ConnectorModel {
    evses: EvseModel[]
    availableConnectors: number
    totalConnectors: number
}

interface ConnectorGroupMap {
    [type: string]: ConnectorGroup
}

export type { ConnectorGroup, ConnectorGroupMap }
