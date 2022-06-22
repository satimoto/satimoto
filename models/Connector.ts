interface ConnectorModel {
    uid: string
    standard: string
    format: string
    powerType: string
    voltage: number
    amperage: number
    wattage: number
}

type ConnectorModelLike = ConnectorModel | undefined

export default ConnectorModel
export type { ConnectorModelLike }
