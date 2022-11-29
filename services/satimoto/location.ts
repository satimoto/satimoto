import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"
import { LOCATION_WITH_EVSES_FRAGMENT } from "./fragment"

/**
 * Get Location
 */

const GET_LOCATION = gql`
    ${LOCATION_WITH_EVSES_FRAGMENT}
    query GetLocation($input: GetLocationInput!) {
        getLocation(input: $input) {
            ...LocationWithEvsesFragment
        }
    }
`

interface GetLocationInput {
    id?: number
    uid?: string
    country?: string
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
            country
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
    interval?: number
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
