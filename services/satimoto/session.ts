import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"
import {
    SESSION_FRAGMENT,
    SESSION_WITH_CHARGE_POINT_FRAGMENT,
    SESSION_WITH_INVOICES_AND_UPDATES_FRAGMENT,
    SESSION_WITH_CHARGE_POINT_INVOICES_AND_UPDATES_FRAGMENT
} from "./fragment"

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
    ${SESSION_WITH_CHARGE_POINT_FRAGMENT}
    query GetSession($input: GetSessionInput!) {
        getSession(input: $input) {
            ...SessionWithChargePointFragment
        }
    }
`

const GET_SESSION_WITH_INVOICES_AND_UPDATES = gql`
    ${SESSION_WITH_INVOICES_AND_UPDATES_FRAGMENT}
    query GetSession($input: GetSessionInput!) {
        getSession(input: $input) {
            ...SessionWithInvoicesAndUpdatesFragment
        }
    }
`

const GET_SESSION_WITH_CHARGE_POINT_INVOICES_AND_UPDATES = gql`
    ${SESSION_WITH_CHARGE_POINT_INVOICES_AND_UPDATES_FRAGMENT}
    query GetSession($input: GetSessionInput!) {
        getSession(input: $input) {
            ...SessionWithChargePointInvoicesAndUpdatesFragment
        }
    }
`

interface GetSessionInput {
    id?: number
    uid?: string
    authorizationId?: string
}

interface GetSessionOptions {
    withChargePoint?: boolean
    withInvoicesAndUpdates?: boolean
}

const getSession = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: GetSessionInput, options?: GetSessionOptions) => {
        return await client.query({
            query:
                options?.withChargePoint && options?.withInvoicesAndUpdates
                    ? GET_SESSION_WITH_CHARGE_POINT_INVOICES_AND_UPDATES
                    : options?.withChargePoint
                    ? GET_SESSION_WITH_CHARGE_POINT
                    : options?.withInvoicesAndUpdates
                    ? GET_SESSION_WITH_INVOICES_AND_UPDATES
                    : GET_SESSION,
            variables: {
                input
            }
        })
    }
}

export { getSession }

/**
 * List Sessions
 */

const LIST_SESSIONS = gql`
    ${SESSION_WITH_CHARGE_POINT_INVOICES_AND_UPDATES_FRAGMENT}
    query ListSessions {
        listSessions {
            ...SessionWithChargePointInvoicesAndUpdatesFragment
        }
    }
`

const listSessions = (client: ApolloClient<NormalizedCacheObject>) => {
    return async () => {
        return await client.query({
            query: LIST_SESSIONS,
            variables: {}
        })
    }
}

export { listSessions }

/**
 * Update Session
 */

const UPDATE_SESSION = gql`
    ${SESSION_FRAGMENT}
    mutation UpdateSession($input: UpdateSessionInput!) {
        updateSession(input: $input) {
            ...SessionFragment
        }
    }
`

interface UpdateSessionInput {
    uid: string
    isConfirmed: boolean
}

const updateSession = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: UpdateSessionInput) => {
        return await client.mutate({
            mutation: UPDATE_SESSION,
            variables: {
                input
            }
        })
    }
}

export { updateSession }
