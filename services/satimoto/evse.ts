import { gql } from "@apollo/client"
import { CONNECTOR_FRAGMENT } from "./connector"
import { LOCATION_FRAGMENT } from "./location"

const EVSE_FRAGMENT = gql`
    fragment EvseFragment on Evse {
        uid
        identifier
        status
    }
`

const EVSE_WITH_CONNECTORS_FRAGMENT = gql`
    ${EVSE_FRAGMENT}
    ${CONNECTOR_FRAGMENT}
    fragment EvseWithConnectorsFragment on Evse {
        ...EvseFragment
        connectors {
            ...ConnectorFragment
        }
    }
`
const EVSE_WITH_LOCATION_FRAGMENT = gql`
    ${EVSE_FRAGMENT}
    ${LOCATION_FRAGMENT}
    fragment EvseWithLocationFragment on Evse {
        ...EvseFragment
        location {
            ...LocationFragment
        }
    }
`

export { EVSE_FRAGMENT, EVSE_WITH_CONNECTORS_FRAGMENT, EVSE_WITH_LOCATION_FRAGMENT }
