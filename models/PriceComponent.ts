import TariffElementModel, { isActiveTariffElement } from "models/TariffElement"
import moment from "moment"
import { TariffDimension } from "types/tariff"

interface PriceComponentModel {
    type: TariffDimension
    price: number
    stepSize: number
}

type PriceComponentModelLike = PriceComponentModel | undefined

export default PriceComponentModel
export type { PriceComponentModelLike }

const getPriceComponents = (
    elements: TariffElementModel[],
    energy: number = 0,
    minPower: number = 0,
    maxPower: number = 0,
    duration: number = 0
): PriceComponentModel[] => {
    const now = moment()
    const nowDate = now.format("YYYY-MM-DD")
    const nowDayOfWeek = now.format("dddd").toUpperCase()
    let priceComponents: PriceComponentModel[] = []

    for (const element of elements) {
        if (isActiveTariffElement(element, now, nowDate, nowDayOfWeek, energy, minPower, maxPower, duration)) {
            priceComponents = priceComponents.concat(element.priceComponents)
        }
    }

    return priceComponents
}

const getPriceComponentByType = (priceComponents: PriceComponentModel[], type: TariffDimension): PriceComponentModelLike => {
    for (const priceComponent of priceComponents) {
        if (priceComponent.type === type) {
            return priceComponent
        }
    }
}

export { getPriceComponents, getPriceComponentByType }
