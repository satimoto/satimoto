import ConnectorModel from "models/Connector"
import EvseModel from "models/Evse"
import LocationModel from "models/Location"
import SessionInvoiceModel from "models/SessionInvoice"

interface SessionModel {
    uid: string
    authorizationId?: string
    startDatetime: string
    endDatetime?: string
    kwh: number
    authMethod: string
    location: LocationModel
    evse: EvseModel
    connector: ConnectorModel
    meterId?: string
    sessionInvoices?: SessionInvoiceModel[]
    status: string
    lastUpdated: string
}

type SessionModelLike = SessionModel | undefined

export default SessionModel
export type { SessionModelLike }
