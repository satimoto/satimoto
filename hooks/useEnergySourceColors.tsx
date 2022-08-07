import { useTheme } from "native-base"

interface EnergySourceColors {
    [type: string]: string
}

const useEnergySourceColors = (): EnergySourceColors => {
    const { colors } = useTheme()

    return {
        "NUCLEAR": colors.teal["300"],
        "GENERAL_FOSSIL": colors.red["300"],
        "COAL": colors.purple["300"],
        "GAS": colors.yellow["300"],
        "GENERAL_GREEN": colors.green["300"],
        "SOLAR": colors.orange["200"],
        "WIND": colors.blue["400"],
        "WATER": colors.cyan["400"],
    }
}

export default useEnergySourceColors