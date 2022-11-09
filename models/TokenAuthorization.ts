import LocationModel from "models/Location"

interface TokenAuthorizationModel {
    authorizationId: string
    authorized: boolean
    countryCode?: string
    partyId?: string
    location?: LocationModel
    verificationKey?: string
}

type TokenAuthorizationModelLike = TokenAuthorizationModel | undefined

export default TokenAuthorizationModel
export type { TokenAuthorizationModelLike }
