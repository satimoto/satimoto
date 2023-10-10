import ConnectorModel from "models/Connector"
import EvseModel from "models/Evse"
import InvoiceRequestModel from "models/InvoiceRequest"
import LocationModel from "models/Location"
import SessionInvoiceModel from "models/SessionInvoice"
import SessionUpdateModel from "models/SessionUpdate"
import { AuthMethod } from "types/authMethod"
import { SessionStatus } from "types/session"

interface SessionModel {
    uid: string
    authorizationId?: string
    startDatetime: string
    endDatetime?: string
    kwh: number
    authMethod: AuthMethod
    location?: LocationModel
    evse?: EvseModel
    connector?: ConnectorModel
    meterId?: string
    invoiceRequests?: InvoiceRequestModel[]
    sessionInvoices?: SessionInvoiceModel[]
    sessionUpdates?: SessionUpdateModel[]
    status: SessionStatus
    lastUpdated: string
}

type SessionModelLike = SessionModel | undefined

export default SessionModel
export type { SessionModelLike }
