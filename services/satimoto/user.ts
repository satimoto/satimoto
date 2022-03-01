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
        }
    }
`

interface CreateUserInput {
    code: string
    pubkey: string
    deviceToken: string
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
