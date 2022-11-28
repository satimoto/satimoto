import ButtonIcon from "components/ButtonIcon"
import SatoshiBalance from "components/SatoshiBalance"
import StopPropagation from "components/StopPropagation"
import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import useColor from "hooks/useColor"
import EvseModel from "models/Evse"
import ConnectorModel, { ConnectorGroup } from "models/Connector"
import { calculateTotalPrice, getPriceComponentByType, getPriceComponents } from "models/PriceComponent"
import { HStack, Spacer, Text, useColorModeValue, useTheme, VStack } from "native-base"
import React, { useEffect, useState } from "react"
import { TariffDimension } from "types/tariff"
import { connectorIcons } from "utils/assets"
import { toNumber, toSatoshi } from "utils/conversion"
import I18n from "utils/i18n"
import styles from "utils/styles"

interface ConnectorGroupButtonProps {
    connectorGroup: ConnectorGroup
    evses: EvseModel[]
    onPress?: (connectorGroup: ConnectorGroup, evses: EvseModel[]) => void
    onPressIn?: () => void
    onPressOut?: () => void
}

const ConnectorGroupButton = ({ connectorGroup, evses, onPress = () => {}, onPressIn = () => {}, onPressOut = () => {} }: ConnectorGroupButtonProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.gray[500], colors.warmGray[50])
    const primaryTextcolor = useColorModeValue("lightText", "darkText")
    const secondaryTextcolor = useColorModeValue("warmGray.200", "dark.200")
    const [dimension, setDimension] = useState("")
    const [price, setPrice] = useState(0)
    const [tariff] = useState(connectorGroup.tariff)

    useEffect(() => {
        if (tariff) {
            const priceComponents = getPriceComponents(tariff.elements)
            const priceComponentEnergy = getPriceComponentByType(priceComponents, TariffDimension.ENERGY)
            const priceComponentTime = getPriceComponentByType(priceComponents, TariffDimension.TIME)

            if (priceComponentEnergy) {
                setDimension(I18n.t("Label_Kwh"))
                setPrice(toNumber(toSatoshi(calculateTotalPrice(priceComponentEnergy))))
            } else if (priceComponentTime) {
                setDimension(I18n.t("Label_Hour"))
                setPrice(toNumber(toSatoshi(calculateTotalPrice(priceComponentTime))))
            }
        }
    }, [tariff?.currencyRateMsat])

    return (
        <StopPropagation>
            <TouchableOpacityOptional
                onPress={() => onPress(connectorGroup, evses)}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={[styles.listButton, { backgroundColor }]}
            >
                <HStack alignItems="center" space={1}>
                    <ButtonIcon justifyContent="flex-end" source={connectorIcons[connectorGroup.standard] || connectorIcons["UNKNOWN"]} />
                    <VStack>
                        <Text color={primaryTextcolor} fontSize="lg" fontWeight="bold">
                            {I18n.t(connectorGroup.standard)}
                        </Text>
                        <Text color={secondaryTextcolor} fontSize="lg">
                            {Math.floor(connectorGroup.wattage / 1000)} kW
                        </Text>
                    </VStack>
                    <Spacer />
                    {price > 0 && (
                        <VStack>
                            <SatoshiBalance size={18} color={"#ffffff"} satoshis={price} />
                            <Text color={secondaryTextcolor} fontSize="lg" textAlign="right">
                                /{dimension}*
                            </Text>
                        </VStack>
                    )}
                </HStack>
            </TouchableOpacityOptional>
        </StopPropagation>
    )
}

export default ConnectorGroupButton
