import TariffElementModel, { isActiveTariffElement } from "models/TariffElement"
import moment from "moment"
import { TariffDimension } from "types/tariff"

interface PriceComponentModel {
    type: TariffDimension
    priceMsat: number
    commissionMsat: number
    taxMsat?: number
    stepSize: number
}

type PriceComponentModelLike = PriceComponentModel | undefined

export default PriceComponentModel
export type { PriceComponentModelLike }

const calculateTotalPrice = (priceComponent: PriceComponentModel): number => {
    return priceComponent.priceMsat + priceComponent.commissionMsat + (priceComponent.taxMsat || 0)
}

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

export { calculateTotalPrice, getPriceComponents, getPriceComponentByType }
