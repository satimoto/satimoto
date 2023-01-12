import LocationModel from "models/Location"

interface TokenAuthorizationModel {
    authorizationId: string
    authorized: boolean
    countryCode?: string
    partyId?: string
    location?: LocationModel
}

type TokenAuthorizationModelLike = TokenAuthorizationModel | undefined

export default TokenAuthorizationModel
export type { TokenAuthorizationModelLike }
