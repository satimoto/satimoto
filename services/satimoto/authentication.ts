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

interface CreateAuthenticationProps {
    action: AuthenticationAction
}

const createAuthentication = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (variables: CreateAuthenticationProps) => {
        return await client.mutate({
            mutation: CREATE_AUTHENTICATION,
            variables
        })
    }
}

export { createAuthentication }

/**
 * Exchange Authentication
 */

const EXCHANGE_AUTHENTICATION = gql`
    mutation ExchangeAuthentication($code: AuthenticationAction!) {
        exchangeAuthentication(code: $code) {
            token
        }
    }
`

interface ExchangeAuthenticationProps {
    code: string
}

const exchangeAuthentication = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (variables: ExchangeAuthenticationProps) => {
        return await client.mutate({
            mutation: EXCHANGE_AUTHENTICATION,
            variables
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

interface VerifyAuthenticationProps {
    code: string
}

const verifyAuthentication = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (variables: VerifyAuthenticationProps, fetchPolicy: FetchPolicy = "no-cache") => {
        return await client.query({ query: VERIFY_AUTHENTICATION, fetchPolicy, variables })
    }
}

export { verifyAuthentication }
