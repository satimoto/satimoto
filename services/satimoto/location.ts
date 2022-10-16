import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"
import { EVSE_WITH_CONNECTORS_FRAGMENT } from "./evse"

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

export { LOCATION_FRAGMENT, LOCATION_WITH_EVSES_FRAGMENT }

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
