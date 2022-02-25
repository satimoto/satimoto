import { ApolloClient, FetchPolicy, gql, NormalizedCacheObject } from "@apollo/client"

export enum AuthenticationAction {
    REGISTER = "register",
    LOGIN = "login",
    LINK = "link",
    AUTH = "auth"
}

/**
 * Create Authentication
 */

const CREATE_AUTHENTICATION = gql`
    mutation CreateAuthentication($action: AuthenticationAction!) {
        createAuthentication(action: $action) {
            code
            lnUrl
        }
    }
`

const createAuthentication = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (action: AuthenticationAction) => {
        return await client.mutate({
            mutation: CREATE_AUTHENTICATION,
            variables: {
                action
            }
        })
    }
}

export { createAuthentication }

/**
 * Exchange Authentication
 */

const EXCHANGE_AUTHENTICATION = gql`
    mutation ExchangeAuthentication($code: String!) {
        exchangeAuthentication(code: $code) {
            token
        }
    }
`

const exchangeAuthentication = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (code: string) => {
        return await client.mutate({
            mutation: EXCHANGE_AUTHENTICATION,
            variables: {
                code
            }
        })
    }
}

export { exchangeAuthentication }

/**
 * Verify Authentication
 */

const VERIFY_AUTHENTICATION = gql`
    query VerifyAuthentication($code: String!) {
        verifyAuthentication(code: $code) {
            verified
        }
    }
`

const verifyAuthentication = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (code: string, fetchPolicy: FetchPolicy = "no-cache") => {
        return await client.query({
            query: VERIFY_AUTHENTICATION,
            fetchPolicy,
            variables: {
                code
            }
        })
    }
}

export { verifyAuthentication }
