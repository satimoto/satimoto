import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"
import { POI_FRAGMENT } from "./fragment"

/**
 * Get Poi
 */

const GET_POI= gql`
    ${POI_FRAGMENT}
    query GetPoi($input: GetPoiInput!) {
        getPoi(input: $input) {
            ...PoiFragment
        }
    }
`

interface GetPoiInput {
    uid: string
}

const getPoi = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: GetPoiInput) => {
        return await client.query({
            query: GET_POI,
            variables: {
                input
            }
        })
    }
}

export { getPoi }

/**
 * List Pois
 */

const LIST_POIS = gql`
    query ListPois($input: ListPoisInput!) {
        listPois(input: $input) {
            uid
            source
            name
            geom
            tagKey
            tagValue
            paymentOnChain
            paymentLn
            paymentLnTap
        }
    }
`

interface ListPoisInput {
    xMin: number
    yMin: number
    xMax: number
    yMax: number
}

const listPois = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: ListPoisInput) => {
        return await client.query({
            query: LIST_POIS,
            variables: {
                input
            }
        })
    }
}

export { listPois }
