import PriceComponentPill from "components/PriceComponentPill"
import { faBolt, faStopwatch, faPlay, faFlagCheckered, faSquareParking } from "@fortawesome/free-solid-svg-icons"
import usePriceComponent from "hooks/usePriceComponent"
import ConnectorModel from "models/Connector"
import { HStack } from "native-base"
import React from "react"
import { TariffDimension } from "types/tariff"

interface PriceComponentTrayProps {
    connector: ConnectorModel
    marginTop?: number
}

const PriceComponentTray = ({ connector, marginTop = 0 }: PriceComponentTrayProps) => {
    const flatPriceComponent = usePriceComponent(connector, TariffDimension.FLAT)
    const energyPriceComponent = usePriceComponent(connector, TariffDimension.ENERGY)
    const timePriceComponent = usePriceComponent(connector, TariffDimension.TIME)
    const parkingTimePriceComponent = usePriceComponent(connector, TariffDimension.PARKING_TIME)
    const sessionTimePriceComponent = usePriceComponent(connector, TariffDimension.SESSION_TIME)

    return (
        <HStack alignItems="flex-start" flexWrap="wrap" justifyContent="space-evenly">
            {flatPriceComponent && (
                <PriceComponentPill variant="outline" colorScheme="green" marginTop={marginTop} priceComponent={flatPriceComponent} icon={faPlay} />
            )}
            {energyPriceComponent && (
                <PriceComponentPill
                    variant="outline"
                    colorScheme="orange"
                    marginTop={marginTop}
                    priceComponent={energyPriceComponent}
                    icon={faBolt}
                />
            )}
            {timePriceComponent && (
                <PriceComponentPill
                    variant="outline"
                    colorScheme="blue"
                    marginTop={marginTop}
                    priceComponent={timePriceComponent}
                    icon={faStopwatch}
                />
            )}
            {parkingTimePriceComponent && (
                <PriceComponentPill
                    variant="outline"
                    colorScheme="blue"
                    marginTop={marginTop}
                    priceComponent={parkingTimePriceComponent}
                    icon={faSquareParking}
                />
            )}
            {sessionTimePriceComponent && (
                <PriceComponentPill
                    variant="outline"
                    colorScheme="red"
                    marginTop={marginTop}
                    priceComponent={sessionTimePriceComponent}
                    icon={faFlagCheckered}
                />
            )}
        </HStack>
    )
}

export default PriceComponentTray
