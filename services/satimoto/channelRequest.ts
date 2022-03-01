import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"

/**
 * Create Channel Request
 */

const CREATE_CHANNEL_REQUEST = gql`
    mutation CreateChannelRequest($input: CreateChannelRequestInput!) {
        createChannelRequest(input: $input) {
            paymentHash
            paymentAddr
            amountMsat
            node {
                pubkey
                addr
                alias
            }
        }
    }
`

interface CreateChannelRequestInput {
    paymentHash: string
    paymentAddr: string
    amountMsat: string
}

const createChannelRequest = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: CreateChannelRequestInput) => {
        return await client.mutate({
            mutation: CREATE_CHANNEL_REQUEST,
            variables: {
                input
            }
        })
    }
}

export { createChannelRequest }
