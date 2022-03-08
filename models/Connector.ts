interface ConnectorModel {
    id: string
    connectorId: string,
    title: string
    icon: string
    voltage: number
    currentType: string
}

type ConnectorModelLike = ConnectorModel | undefined

export default ConnectorModel
export type { ConnectorModelLike }
