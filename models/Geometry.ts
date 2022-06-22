interface PointModel {
    type: string
    coordinates: number[]
}

type PointModelLike = PointModel | undefined

export default PointModel
export type { PointModelLike }
