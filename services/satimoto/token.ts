import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"

/**
 * Create Token
 */

 const CREATE_TOKEN = gql`
    mutation CreateToken($input: CreateTokenInput!) {
        createToken(input: $input) {
            id
            uid
            visualNumber
        }
    }
`

interface CreateTokenInput {
    uid: string
}

const createToken = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: CreateTokenInput) => {
        return await client.mutate({
            mutation: CREATE_TOKEN,
            variables: {
                input
            }
        })
    }
}

export { createToken }

/**
 * List Tokens
 */

const LIST_TOKENS = gql`
    query ListTokens {
        listTokens {
            id
            uid
            visualNumber
        }
    }
`

const listTokens = (client: ApolloClient<NormalizedCacheObject>) => {
    return async () => {
        return await client.query({
            query: LIST_TOKENS,
            variables: {},
            fetchPolicy: 'no-cache'
        })
    }
}

export { listTokens }
