interface FiatRateModel {
    id: string
    value: number
}

type FiatRateModelLike = FiatRateModel | undefined

export default FiatRateModel
export type { FiatRateModelLike }
