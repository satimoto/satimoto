import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"

/**
 * List Channels
 */

const LIST_CHANNELS = gql`
    query ListChannels {
        listChannels {
            channelId
        }
    }
`

const listChannels = (client: ApolloClient<NormalizedCacheObject>) => {
    return async () => {
        return await client.query({
            query: LIST_CHANNELS,
            variables: {}
        })
    }
}

export { listChannels }
