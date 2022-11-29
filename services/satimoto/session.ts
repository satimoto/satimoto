import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"
import { CONNECTOR_FRAGMENT, EVSE_FRAGMENT, LOCATION_FRAGMENT, SESSION_FRAGMENT } from "./fragment"

/**
 * Get Session
 */

const GET_SESSION = gql`
    ${SESSION_FRAGMENT}
    query GetSession($input: GetSessionInput!) {
        getSession(input: $input) {
            ...SessionFragment
        }
    }
`

const GET_SESSION_WITH_CHARGE_POINT = gql`
    ${SESSION_FRAGMENT}
    ${LOCATION_FRAGMENT}
    ${EVSE_FRAGMENT}
    ${CONNECTOR_FRAGMENT}
    query GetSession($input: GetSessionInput!) {
        getSession(input: $input) {
            ...SessionFragment
            location {
                ...LocationFragment
            }
            evse {
                ...EvseFragment
            }
            connector {
                ...ConnectorFragment
            }
        }
    }
`

interface GetSessionInput {
    id?: number
    uid?: string
    authorizationId?: string
}

const getSession = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: GetSessionInput, withChargePoint: boolean = false) => {
        return await client.query({
            query: withChargePoint ? GET_SESSION_WITH_CHARGE_POINT : GET_SESSION,
            variables: {
                input
            }
        })
    }
}

export { getSession }
