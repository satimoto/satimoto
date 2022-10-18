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
