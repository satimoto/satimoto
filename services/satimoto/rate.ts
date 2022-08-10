import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"

/**
 * Get Rate
 */

const GET_RATE = gql`
    query GetRate($currency: String!) {
        getRate(currency: $currency) {
            rate
            rateMsat
            lastUpdated
        }
    }
`

const getRate = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (currency: string) => {
        return await client.query({
            query: GET_RATE,
            variables: {
                currency
            }
        })
    }
}

export { getRate }
