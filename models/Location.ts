import EvseModel from "models/Evse"
import PointModel from "models/Geometry"

interface LocationModel {
    uid: string
    name: string
    address?: string
    city?: string
    postalCode?: string
    country: string
    geom: PointModel
    evses?: EvseModel[]
    availableEvses: number
    totalEvses: number
    isExperimental: boolean
    isRemoteCapable: boolean
    isRfidCapable: boolean
}

type LocationModelLike = LocationModel | undefined

export default LocationModel
export type { LocationModelLike }
