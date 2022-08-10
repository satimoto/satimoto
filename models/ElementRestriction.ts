interface ElementRestrictionModel {
    startTime?: string
    endTime?: string
    startDate?: string
    endDate?: string
    minKwh?: number
    maxKwh?: number
    minPower?: number
    maxPower?: number
    minDuration?: number
    maxDuration?: number
    dayOfWeek: string[]
}

type ElementRestrictionModelLike = ElementRestrictionModel | undefined

export default ElementRestrictionModel
export type { ElementRestrictionModelLike }
