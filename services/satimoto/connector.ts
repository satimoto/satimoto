import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"
import { EVSE_WITH_LOCATION_FRAGMENT } from "./evse"
import { TARIFF_FRAGMENT } from "./tariff"

const CONNECTOR_FRAGMENT = gql`
    fragment ConnectorFragment on Connector {
        uid
        identifier
        standard
        format
        voltage
        amperage
        wattage
        powerType
    }
`

const CONNECTOR_WITH_TARIFF_FRAGMENT = gql`
    ${CONNECTOR_FRAGMENT}
    ${TARIFF_FRAGMENT}
    fragment ConnectorWithTariffFragment on Connector {
        ...ConnectorFragment
        tariff {
            ...TariffFragment
        }
    }
`

export { CONNECTOR_FRAGMENT, CONNECTOR_WITH_TARIFF_FRAGMENT }


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
