import PointModel from "models/Geometry"
import TagModel from "models/Tag"

interface PoiModel {
    uid: string
    source: string
    name: string
    geom: PointModel
    description?: string
    address?: string
    city?: string
    postalCode?: string
    tagKey: string
    tagValue: string
    tags?: TagModel[]
    paymentOnChain: boolean
    paymentLn: boolean
    paymentLnTap: boolean
    paymentUri?: string
    openingTimes?: string
    phone?: string
    website?: string 
}

type PoiModelWithIcon = PoiModel & {
    iconImage: string
}

type PoiModelLike = PoiModel | undefined

export default PoiModel
export type { PoiModelLike, PoiModelWithIcon }
