import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"

/**
 * Get Location
 */

const GET_LOCATION = gql`
    query GetLocation($input: GetLocationInput!) {
        getLocation(input: $input) {
            uid
            name
            address
            city
            postalCode
            country
            geom
            evses {
                uid
                identifier
                status
                connectors {
                    uid
                    identifier
                    standard
                    format
                    voltage
                    amperage
                    wattage
                    powerType
                    tariff {
                        uid
                        currency
                        currencyRate
                        currencyRateMsat
                        elements {
                            priceComponents {
                                type
                                price
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
        }
    }
`

interface GetLocationInput {
    id?: number
    uid?: string
}

const getLocation = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: GetLocationInput) => {
        return await client.query({
            query: GET_LOCATION,
            variables: {
                input
            }
        })
    }
}

export { getLocation }

/**
 * List Locations
 */

const LIST_LOCATIONS = gql`
    query ListLocations($input: ListLocationsInput!) {
        listLocations(input: $input) {
            uid
            name
            geom
            availableEvses
            totalEvses
            isRemoteCapable
            isRfidCapable
        }
    }
`

interface ListLocationsInput {
    xMin: number
    yMin: number
    xMax: number
    yMax: number
    lastUpdate?: string
}

const listLocations = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: ListLocationsInput) => {
        return await client.query({
            query: LIST_LOCATIONS,
            variables: {
                input
            }
        })
    }
}

export { listLocations }
