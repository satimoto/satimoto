import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"

/**
 * Create User
 */

const CREATE_USER = gql`
    mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
            id
            nodePubkey
            deviceToken
        }
    }
`

interface CreateUserInput {
    code: string
    nodePubkey: string
    deviceToken: string
}

const createUser = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (variables: CreateUserInput) => {
        return await client.mutate({
            mutation: CREATE_USER,
            variables: {
                input: variables
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
            nodePubkey
            deviceToken
        }
    }
`

interface UpdateUserInput {
    deviceToken: string
}

const updateUser = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (variables: UpdateUserInput) => {
        return await client.mutate({
            mutation: UPDATE_USER,
            variables: {
                input: variables
            }
        })
    }
}

export { updateUser }
