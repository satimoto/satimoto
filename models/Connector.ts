interface Connector {
    id: string
    connectorId: string,
    title: string
    icon: string
    voltage: number
    currentType: string
}

type ConnectorLike = Connector | undefined

export default Connector
export type { ConnectorLike }
