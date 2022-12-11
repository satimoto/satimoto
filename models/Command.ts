interface StartCommandModel {
    status: string
    authorizationId: string
    verificationKey: string
    locationUid: string
    evseUid?: String
}

type StartCommandModelLike = StartCommandModel | undefined

export default StartCommandModel
export type { StartCommandModelLike }

interface StopCommandModel {
    status: string
    sessionUid: string
}

type StopCommandModelLike = StopCommandModel | undefined

export type { StopCommandModel, StopCommandModelLike }
