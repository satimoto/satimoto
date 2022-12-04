import ConnectorModel from "models/Connector"
import { getPriceComponentByType, getPriceComponents, PriceComponentModelLike } from "models/PriceComponent"
import { TariffDimension } from "types/tariff"

const usePriceComponent = ({ tariff }: ConnectorModel, type: TariffDimension): PriceComponentModelLike => {
    if (tariff?.elements) {
        const priceComponents = getPriceComponents(tariff.elements)

        return getPriceComponentByType(priceComponents, type)
    }
}

export default usePriceComponent
