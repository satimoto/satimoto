import { SessionStatus } from "types/session"

interface SessionUpdateModel {
    id: number
    kwh: number
    status: SessionStatus
    lastUpdated: string
}

type SessionUpdateModelLike = SessionUpdateModel | undefined

export default SessionUpdateModel
export type { SessionUpdateModelLike }
