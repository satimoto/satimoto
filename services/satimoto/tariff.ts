import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"
import { TARIFF_FRAGMENT } from "./fragment"

/**
 * Get Tariff
 */

const GET_TARIFF = gql`
    ${TARIFF_FRAGMENT}
    query GetTariff($input: GetTariffInput!) {
        getTariff(input: $input) {
            ...TariffFragment
        }
    }
`

interface GetTariffInput {
    id?: number
    uid?: string
}

const getTariff = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: GetTariffInput) => {
        return await client.query({
            query: GET_TARIFF,
            variables: {
                input
            }
        })
    }
}

export { getTariff }
