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

const isActiveTariffElementNow = (element: TariffElementModel, energy?: number, minPower?: number, maxPower?: number, duration?: number): boolean => {
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
    energy?: number,
    minPower?: number,
    maxPower?: number,
    duration?: number
): boolean => {
    const restrictions = element.restrictions

    return (
        restrictions == null ||
        ((restrictions.startDate == null || now.isAfter(restrictions.startDate)) &&
            (restrictions.endDate == null || now.isBefore(restrictions.endDate)) &&
            (restrictions.startTime == null || now.isAfter(moment(`${nowDate}T${restrictions.startTime}`))) &&
            (restrictions.endTime == null || now.isBefore(moment(`${nowDate}T${restrictions.endTime}`))) &&
            (restrictions.minKwh == null || energy === null || energy === undefined || energy >= restrictions.minKwh) &&
            (restrictions.maxKwh == null || energy === null || energy === undefined || (energy > 0 && energy < restrictions.maxKwh)) &&
            (restrictions.minPower == null || minPower === null || minPower === undefined || minPower >= restrictions.minPower) &&
            (restrictions.maxPower == null || maxPower === null || maxPower === undefined || (maxPower > 0 && maxPower < restrictions.maxPower)) &&
            (restrictions.minDuration == null || duration === null || duration === undefined || duration >= restrictions.minDuration) &&
            (restrictions.maxDuration == null ||
                duration === null ||
                duration === undefined ||
                (duration > 0 && duration < restrictions.maxDuration)) &&
            (restrictions.dayOfWeek.length === 0 || restrictions.dayOfWeek.includes(nowDayOfWeek)))
    )
}

export { isActiveTariffElement, isActiveTariffElementNow }
