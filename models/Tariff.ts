import EnergyMixModel from "./EnergyMix"
import TariffElementModel from "./TariffElement"

interface TariffModel {
    uid: string
    currency: string
    currencyRate: number
    currencyRateMsat: number
    isIntermediateCdrCapable: boolean
    elements: TariffElementModel[]
    energyMix?: EnergyMixModel
}

type TariffModelLike = TariffModel | undefined

export default TariffModel
export type { TariffModelLike }
