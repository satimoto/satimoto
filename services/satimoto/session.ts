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
                LocationFragment
            }
            evse {
                EvseFragment
            }
            connector {
                ConnectorFragment
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

/**
 * Get Session Invoice
 */

const GET_SESSION_INVOICE = gql`
    query GetSessionInvoice($id: number!) {
        getSessionInvoice(id: $id) {
            id
            currency
            currencyRate
            currencyRateMsat
            priceFiat
            priceMsat
            commissionFiat
            commissionMsat
            taxFiat
            taxMsat
            totalFiat
            totalMsat
            paymentRequest
            signature
            isSettled
            isExpired
            lastUpdated
        }
    }
`

const getSessionInvoice = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (id: number) => {
        return await client.query({
            query: GET_SESSION_INVOICE,
            variables: {
                id
            }
        })
    }
}

export { getSessionInvoice }
