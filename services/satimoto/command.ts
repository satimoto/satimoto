import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"

/**
 * Start Session
 */

 const START_SESSION = gql`
    mutation StartSession($input: StartSessionInput!) {
        startSession(input: $input) {
            status
            authorizationId
            locationUid
            evseUid
        }
    }
`

interface StartSessionInput {
    locationUid: string
    evseUid?: string
}

const startSession = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: StartSessionInput) => {
        return await client.mutate({
            mutation: START_SESSION,
            variables: {
                input
            }
        })
    }
}

export { startSession }

/**
 * Stop Session
 */

 const STOP_SESSION = gql`
    mutation StopSession($input: StopSessionInput!) {
        stopSession(input: $input) {
            status
            sessionUid
        }
    }
`

interface StopSessionInput {
    sessionUid: string
}

const stopSession = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: StopSessionInput) => {
        return await client.mutate({
            mutation: STOP_SESSION,
            variables: {
                input
            }
        })
    }
}

export { stopSession }
