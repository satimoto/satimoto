import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"

/**
 * Get Connector
 */

const GET_CONNECTOR = gql`
    query GetConnector($input: GetConnectorInput!) {
        getConnector(input: $input) {
            uid
            identifier
            standard
            format
            voltage
            amperage
            wattage
            powerType
            evse {
                uid
                identifier
                status
                location {
                    uid
                    name
                    address
                    city
                    postalCode
                    country
                    geom
                }
            }
            tariff {
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
