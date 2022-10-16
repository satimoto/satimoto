import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"

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

export { TARIFF_FRAGMENT }

/**
 * Get Tariff
 */

const GET_TARIFF = gql`
    ${TARIFF_FRAGMENT}
    query GetTariff($input: GetTariffInput!) {
        getTariff(input: $input) {
            ...TariffFragment
        }
    }
`

interface GetTariffInput {
    id?: number
    uid?: string
}

const getTariff = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: GetTariffInput) => {
        return await client.query({
            query: GET_TARIFF,
            variables: {
                input
            }
        })
    }
}

export { getTariff }
