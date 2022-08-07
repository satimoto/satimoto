import moment from "moment"
import ElementRestrictionModel from "./ElementRestriction"
import PriceComponentModel from "./PriceComponent"

interface TariffElementModel {
    priceComponents: PriceComponentModel[]
    restrictions?: ElementRestrictionModel
}

type TariffElementModelLike = TariffElementModel | undefined

export default TariffElementModel
export type { TariffElementModelLike }

type TariffElementGroup = { elements: TariffElementModel[] }
type TariffElementGroupList = TariffElementGroup[]

export type { TariffElementGroup, TariffElementGroupList }

const isActiveTariffElementNow = (
    element: TariffElementModel,
    energy: number = 0,
    minPower: number = 0,
    maxPower: number = 0,
    duration: number = 0
): boolean => {
    const now = moment()
    const nowDate = now.format("YYYY-MM-DD")
    const nowDayOfWeek = now.format("dddd").toUpperCase()

    return isActiveTariffElement(element, now, nowDate, nowDayOfWeek, energy, minPower, maxPower, duration)
}

const isActiveTariffElement = (
    element: TariffElementModel,
    now: moment.Moment,
    nowDate: string,
    nowDayOfWeek: string,
    energy: number = 0,
    minPower: number = 0,
    maxPower: number = 0,
    duration: number = 0
): boolean => {
    const restrictions = element.restrictions

    return (
        !restrictions ||
        ((!restrictions.startDate || now.isAfter(restrictions.startDate)) &&
            (!restrictions.endDate || now.isBefore(restrictions.endDate)) &&
            (!restrictions.startTime || now.isAfter(moment(`${nowDate}T${restrictions.startDate}`))) &&
            (!restrictions.endTime || now.isBefore(moment(`${nowDate}T${restrictions.endTime}`))) &&
            (!restrictions.minKwh || energy >= restrictions.minKwh) &&
            (!restrictions.maxKwh || (energy > 0 && energy < restrictions.maxKwh)) &&
            (!restrictions.minPower || minPower >= restrictions.minPower) &&
            (!restrictions.maxPower || (maxPower > 0 && maxPower < restrictions.maxPower)) &&
            (!restrictions.minDuration || duration >= restrictions.minDuration) &&
            (!restrictions.maxDuration || duration < restrictions.maxDuration) &&
            (restrictions.dayOfWeek.length === 0 || restrictions.dayOfWeek.includes(nowDayOfWeek)))
    )
}

export { isActiveTariffElement, isActiveTariffElementNow }

