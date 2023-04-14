interface FiatCurrencyModel {
    id: string
    name: string
    decimals: number
    symbol: string
}

type FiatCurrencyModelLike = FiatCurrencyModel | undefined

export default FiatCurrencyModel
export type { FiatCurrencyModelLike }
