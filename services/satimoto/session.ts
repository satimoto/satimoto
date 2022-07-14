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
            location {
                uid
                name
                address
                city
                postalCode
                country
                geom
            }
            evse {
                uid
                status
                evseId
            }
            connector {
                uid
                standard
                format
                voltage
                amperage
                wattage
                powerType
                tariffId
            }
            meterId
            sessionInvoices {
                id
                currency
                currencyRate
                currencyRateMsat
                amountFiat
                amountMsat
                commissionFiat
                commissionMsat
                taxFiat
                taxMsat
                paymentRequest
                isSettled
                isExpired
                lastUpdated
            }
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
            amountFiat
            amountMsat
            commissionFiat
            commissionMsat
            taxFiat
            taxMsat
            paymentRequest
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
