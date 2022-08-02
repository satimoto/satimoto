interface PriceComponentModel {
    type: string
    price: number
    stepSize: number
}

type PriceComponentModelLike = PriceComponentModel | undefined

export default PriceComponentModel
export type { PriceComponentModelLike }
