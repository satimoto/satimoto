import { gql } from "@apollo/client"

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

const EVSE_FRAGMENT = gql`
    fragment EvseFragment on Evse {
        uid
        identifier
        status
        capabilities {
            text
            description
        }
    }
`

const LOCATION_FRAGMENT = gql`
    fragment LocationFragment on Location {
        uid
        name
        address
        city
        postalCode
        country
        geom
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

const LOCATION_WITH_EVSES_FRAGMENT = gql`
    ${LOCATION_FRAGMENT}
    ${EVSE_WITH_CONNECTORS_FRAGMENT}
    fragment LocationWithEvsesFragment on Location {
        ...LocationFragment
        evses {
            ...EvseWithConnectorsFragment
        }
    }
`

const SESSION_FRAGMENT = gql`
    fragment SessionFragment on Evse {
        uid
        authorizationId
        startDatetime
        endDatetime
        kwh
        authMethod
        meterId
        invoiceRequest
        status
        lastUpdated
    }
`

const TARIFF_FRAGMENT = gql`
    fragment TariffFragment on Tariff {
        uid
        currency
        currencyRate
        currencyRateMsat
        isIntermediateCdrCapable
        elements {
            priceComponents {
                type
                priceMsat
                commissionMsat
                taxMsat
                stepSize
            }
            restrictions {
                startTime
                endTime
                startDate
                endDate
                minKwh
                maxKwh
                minPower
                maxPower
                minDuration
                maxDuration
                dayOfWeek
            }
        }
        energyMix {
            isGreenEnergy
            energySources {
                source
                percentage
            }
            environmentalImpact {
                source
                amount
            }
            supplierName
            energyProductName
        }
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

export {
    CONNECTOR_FRAGMENT,
    CONNECTOR_WITH_TARIFF_FRAGMENT,
    EVSE_FRAGMENT,
    EVSE_WITH_CONNECTORS_FRAGMENT,
    EVSE_WITH_LOCATION_FRAGMENT,
    LOCATION_FRAGMENT,
    LOCATION_WITH_EVSES_FRAGMENT,
    SESSION_FRAGMENT,
    TARIFF_FRAGMENT
}
