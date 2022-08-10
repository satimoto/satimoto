import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"

/**
 * Get Tariff
 */

const GET_TARIFF = gql`
    query GetTariff($input: GetTariffInput!) {
        getTariff(input: $input) {
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
