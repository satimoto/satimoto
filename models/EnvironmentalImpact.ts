interface EnvironmentalImpactModel {
    source: string
    amount: number
}

type EnvironmentalImpactModelLike = EnvironmentalImpactModel | undefined

export default EnvironmentalImpactModel
export type { EnvironmentalImpactModelLike }
