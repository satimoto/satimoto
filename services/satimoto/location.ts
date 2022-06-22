import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"

/**
 * Get Location
 */

const GET_LOCATION = gql`
    query GetLocation($uid: String!) {
        getLocation(uid: $uid) {
            uid
            name
            address
            city
            postalCode
            country
            geom
            evses {
                uid
                status
                evseId
                connectors {
                    uid
                    standard
                    format
                    voltage
                    amperage
                    wattage
                    powerType
                    tariffId
                }
            }
        }
    }
`

const getLocation = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (uid: string) => {
        return await client.query({
            query: GET_LOCATION,
            variables: {
                uid
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
