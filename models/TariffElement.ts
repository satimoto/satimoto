import ElementRestrictionModel from "./ElementRestriction"
import PriceComponentModel from "./PriceComponent"

interface TariffElementModel {
    priceComponents: PriceComponentModel[]
    restrictions?: ElementRestrictionModel
}

type TariffElementModelLike = TariffElementModel | undefined

export default TariffElementModel
export type { TariffElementModelLike }
