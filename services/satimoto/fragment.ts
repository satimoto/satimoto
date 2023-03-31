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

const TARIFF_FRAGMENT = gql`
    fragment TariffFragment on Tariff {
        uid
        currency
        currencyRate
        currencyRateMsat
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

const EVSE_FRAGMENT = gql`
    fragment EvseFragment on Evse {
        uid
        evseId
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
        isExperimental
    }
`

const EVSE_WITH_CONNECTORS_FRAGMENT = gql`
    ${EVSE_FRAGMENT}
    ${CONNECTOR_WITH_TARIFF_FRAGMENT}
    fragment EvseWithConnectorsFragment on Evse {
        ...EvseFragment
        connectors {
            ...ConnectorWithTariffFragment
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

const POI_FRAGMENT = gql`
    fragment PoiFragment on Poi {
        source
        name
        description
        geom
        address
        city
        postalCode
        tagKey
        tagValue
        tags {
            key
            value
        }
        paymentOnChain
        paymentLn
        paymentLnTap
        paymentUri
        openingTimes
        phone
        website
    }
`

const INVOICE_REQUEST_FRAGMENT = gql`
    fragment InvoiceRequestFragment on InvoiceRequest {
        id
        currency
        memo
        priceFiat
        priceMsat
        commissionFiat
        commissionMsat
        taxFiat
        taxMsat
        totalFiat
        totalMsat
        isSettled
        releaseDate
        promotion {
            code
        }
    }
`

const SESSION_INVOICE_FRAGMENT = gql`
    fragment SessionInvoiceFragment on SessionInvoice {
        id
        currency
        currencyRate
        currencyRateMsat
        priceFiat
        priceMsat
        commissionFiat
        commissionMsat
        taxFiat
        taxMsat
        totalFiat
        totalMsat
        paymentRequest
        signature
        isSettled
        isExpired
        estimatedEnergy
        estimatedTime
        meteredEnergy
        meteredTime
        lastUpdated
    }
`

const SESSION_UPDATE_FRAGMENT = gql`
    fragment SessionUpdateFragment on SessionUpdate {
        id
        kwh
        status
        lastUpdated
    }
`

const SESSION_FRAGMENT = gql`
    fragment SessionFragment on Session {
        uid
        authorizationId
        startDatetime
        endDatetime
        kwh
        authMethod
        meterId
        status
        lastUpdated
    }
`

const SESSION_WITH_CHARGE_POINT_FRAGMENT = gql`
    ${SESSION_FRAGMENT}
    ${LOCATION_FRAGMENT}
    ${EVSE_FRAGMENT}
    ${CONNECTOR_FRAGMENT}
    fragment SessionWithChargePointFragment on Session {
        ...SessionFragment
        location {
            ...LocationFragment
        }
        evse {
            ...EvseFragment
        }
        connector {
            ...ConnectorFragment
        }
    }
`

const SESSION_WITH_INVOICES_AND_UPDATES_FRAGMENT = gql`
    ${SESSION_FRAGMENT}
    ${INVOICE_REQUEST_FRAGMENT}
    ${SESSION_INVOICE_FRAGMENT}
    ${SESSION_UPDATE_FRAGMENT}
    fragment SessionWithInvoicesAndUpdatesFragment on Session {
        ...SessionFragment
        invoiceRequests {
            ...InvoiceRequestFragment
        }
        sessionInvoices {
            ...SessionInvoiceFragment
        }
        sessionUpdates {
            ...SessionUpdateFragment
        }
    }
`

const SESSION_WITH_CHARGE_POINT_INVOICES_AND_UPDATES_FRAGMENT = gql`
    ${SESSION_WITH_CHARGE_POINT_FRAGMENT}
    ${INVOICE_REQUEST_FRAGMENT}
    ${SESSION_INVOICE_FRAGMENT}
    ${SESSION_UPDATE_FRAGMENT}
    fragment SessionWithChargePointInvoicesAndUpdatesFragment on Session {
        ...SessionWithChargePointFragment
        invoiceRequests {
            ...InvoiceRequestFragment
        }
        sessionInvoices {
            ...SessionInvoiceFragment
        }
        sessionUpdates {
            ...SessionUpdateFragment
        }
    }
`

const EVSE_WITH_CONNECTORS_AND_LOCATION_FRAGMENT = gql`
    ${EVSE_FRAGMENT}
    ${CONNECTOR_WITH_TARIFF_FRAGMENT}
    ${LOCATION_FRAGMENT}
    fragment EvseWithConnectorsAndLocationFragment on Evse {
        ...EvseFragment
        connectors {
            ...ConnectorWithTariffFragment
        }
        location {
            ...LocationFragment
        }
    }
`

export {
    CONNECTOR_FRAGMENT,
    CONNECTOR_WITH_TARIFF_FRAGMENT,
    EVSE_FRAGMENT,
    EVSE_WITH_CONNECTORS_FRAGMENT,
    EVSE_WITH_CONNECTORS_AND_LOCATION_FRAGMENT,
    EVSE_WITH_LOCATION_FRAGMENT,
    INVOICE_REQUEST_FRAGMENT,
    LOCATION_FRAGMENT,
    LOCATION_WITH_EVSES_FRAGMENT,
    POI_FRAGMENT,
    SESSION_INVOICE_FRAGMENT,
    SESSION_UPDATE_FRAGMENT,
    SESSION_FRAGMENT,
    SESSION_WITH_CHARGE_POINT_FRAGMENT,
    SESSION_WITH_INVOICES_AND_UPDATES_FRAGMENT,
    SESSION_WITH_CHARGE_POINT_INVOICES_AND_UPDATES_FRAGMENT,
    TARIFF_FRAGMENT
}
