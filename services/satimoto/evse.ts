import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"
import { EVSE_WITH_CONNECTORS_AND_LOCATION_FRAGMENT } from "./fragment"

/**
 * Get Evse
 */

const GET_EVSE = gql`
    ${EVSE_WITH_CONNECTORS_AND_LOCATION_FRAGMENT}
    query GetEvse($input: GetEvseInput!) {
        getEvse(input: $input) {
            ...EvseWithConnectorsAndLocationFragment
        }
    }
`

interface GetEvseInput {
    id?: number
    evseId?: string
    identifier?: string
}

const getEvse = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: GetEvseInput) => {
        return await client.query({
            query: GET_EVSE,
            variables: {
                input
            }
        })
    }
}

export { getEvse }
