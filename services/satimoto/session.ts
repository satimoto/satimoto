import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"

/**
 * Get Session
 */

const GET_SESSION = gql`
    query GetSession($input: GetSessionInput!) {
        getSession(input: $input) {
            uid
            authorizationId
            startDatetime
            endDatetime
            kwh
            authMethod
            meterId
            status
            lastUpdated
        }
    }
`

interface GetSessionInput {
    id?: number
    uid?: string
    authorizationId?: string
}

const getSession = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: GetSessionInput) => {
        return await client.query({
            query: GET_SESSION,
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
