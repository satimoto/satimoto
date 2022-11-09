import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"
import { CONNECTOR_FRAGMENT, EVSE_WITH_LOCATION_FRAGMENT, TARIFF_FRAGMENT } from "./fragment"

/**
 * Get Connector
 */

const GET_CONNECTOR = gql`
    ${CONNECTOR_FRAGMENT}
    ${EVSE_WITH_LOCATION_FRAGMENT}
    ${TARIFF_FRAGMENT}
    query GetConnector($input: GetConnectorInput!) {
        getConnector(input: $input) {
            ...ConnectorFragment
            evse {
                ...EvseWithLocationFragment
            }
            tariff {
                ...TariffFragment
            }
        }
    }
`

interface GetConnectorInput {
    id?: number
    identifier?: string
}

const getConnector = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: GetConnectorInput) => {
        return await client.query({
            query: GET_CONNECTOR,
            variables: {
                input
            }
        })
    }
}

export { getConnector }
