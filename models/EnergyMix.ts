import EnergySourceModel from "./EnergySource"
import EnvironmentalImpactModel from "./EnvironmentalImpact"

interface EnergyMixModel {
    isGreenEnergy: boolean
    energySources: EnergySourceModel[]
    environmentalImpact: EnvironmentalImpactModel[]
    supplierName?: string
    energyProductName?: string
}

type EnergyMixModelLike = EnergyMixModel | undefined

export default EnergyMixModel
export type { EnergyMixModelLike }
