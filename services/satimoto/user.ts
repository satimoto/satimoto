import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"

const CREATE_USER = gql`
    mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
            id
            nodeKey
            nodeAddress
            deviceToken
        }
    }
`

interface CreateUserProps {
    code: string
    nodeKey: string
    nodeAddress: string
    deviceToken: string
}

const createUser = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (variables: CreateUserProps) => {
        return await client.mutate({
            mutation: CREATE_USER,
            variables: {
                input: variables
            }
        })
    }
}

export { createUser }
