import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"

/**
 * Create User
 */

const CREATE_USER = gql`
    mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
            id
            pubkey
            deviceToken
            referralCode
        }
    }
`

interface CreateUserInput {
    code: string
    pubkey: string
    deviceToken?: string
}

const createUser = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: CreateUserInput) => {
        return await client.mutate({
            mutation: CREATE_USER,
            variables: {
                input
            }
        })
    }
}

export { createUser }

/**
 * Get User
 */

const GET_USER = gql`
    query GetUser {
        getUser {
            id
            pubkey
            referralCode
            node {
                pubkey
                addr
            }
        }
    }
`
const getUser = (client: ApolloClient<NormalizedCacheObject>) => {
    return async () => {
        return await client.query({
            query: GET_USER,
            variables: {}
        })
    }
}

export { getUser }

/**
 * Pong User
 */

const PONG_USER = gql`
    mutation PongUser($input: PongUserInput!) {
        pongUser(input: $input) {
            ok
        }
    }
`

interface PongUserInput {
    pong: string
}

const pongUser = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: PongUserInput) => {
        return await client.mutate({
            mutation: PONG_USER,
            variables: {
                input
            }
        })
    }
}

export { pongUser }

/**
 * Update User
 */

const UPDATE_USER = gql`
    mutation UpdateUser($input: UpdateUserInput!) {
        updateUser(input: $input) {
            id
            pubkey
            deviceToken
        }
    }
`

interface UpdateUserInput {
    deviceToken: string
}

const updateUser = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: UpdateUserInput) => {
        return await client.mutate({
            mutation: UPDATE_USER,
            variables: {
                input
            }
        })
    }
}

export { updateUser }
