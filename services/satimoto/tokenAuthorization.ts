import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"
import { LOCATION_FRAGMENT } from "./fragment"

/**
 * Update Token Authorization
 */

const UPDATE_TOKEN_AUTHORIZATION = gql`
    ${LOCATION_FRAGMENT}
    mutation UpdateTokenAuthorization($input: UpdateTokenAuthorizationInput!) {
        updateTokenAuthorization(input: $input) {
            location {
                ...LocationFragment
            }
            authorizationId
            authorized
            verificationKey
        }
    }
`

interface UpdateTokenAuthorizationInput {
    authorizationId: string
    authorize: boolean
}

const updateTokenAuthorization = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: UpdateTokenAuthorizationInput) => {
        return await client.mutate({
            mutation: UPDATE_TOKEN_AUTHORIZATION,
            variables: {
                input
            }
        })
    }
}

export { updateTokenAuthorization }
