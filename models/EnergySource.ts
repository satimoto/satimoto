interface EnergySourceModel {
    source: string
    percentage: number
}

type EnergySourceModelLike = EnergySourceModel | undefined

export default EnergySourceModel
export type { EnergySourceModelLike }
