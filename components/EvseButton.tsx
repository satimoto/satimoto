import ButtonIcon from "components/ButtonIcon"
import EvseBadge from "components/EvseBadge"
import SatoshiBalance from "components/SatoshiBalance"
import StopPropagation from "components/StopPropagation"
import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import useColor from "hooks/useColor"
import ConnectorModel from "models/Connector"
import EvseModel from "models/Evse"
import { calculateTotalPrice, getPriceComponentByType, getPriceComponents } from "models/PriceComponent"
import { HStack, Spacer, Text, useColorModeValue, useTheme, VStack } from "native-base"
import React, { useEffect, useState } from "react"
import { TariffDimension } from "types/tariff"
import { toNumber, toSatoshi } from "utils/conversion"
import { connectorIcons } from "utils/assets"
import I18n from "utils/i18n"
import styles from "utils/styles"


interface EvseButtonProps {
    connector: ConnectorModel
    evse: EvseModel
    onPress?: (connector: ConnectorModel, evse: EvseModel) => void
}

const EvseButton = ({ connector, evse, onPress = () => {} }: EvseButtonProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.gray[500], colors.warmGray[50])
    const primaryTextcolor = useColorModeValue("lightText", "darkText")
    const secondaryTextcolor = useColorModeValue("warmGray.200", "dark.200")
    const [dimension, setDimension] = useState("")
    const [price, setPrice] = useState(0)
    const [tariff] = useState(connector.tariff)

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
    }, [])

    return (
        <StopPropagation>
            <TouchableOpacityOptional onPress={() => onPress(connector, evse)} style={[styles.listButton, { backgroundColor }]}>
                <HStack alignItems="center" space={1}>
                    <ButtonIcon source={connectorIcons[connector.standard] || connectorIcons["UNKNOWN"]} style={styles.buttonIcon}>
                        <EvseBadge evse={evse} />
                    </ButtonIcon>
                    <VStack>
                        <Text color={primaryTextcolor} fontSize="lg" fontWeight="bold">
                            {evse.identifier || evse.uid}
                        </Text>
                        <Text color={secondaryTextcolor} fontSize="lg">
                            {I18n.t(evse.status)}
                        </Text>
                    </VStack>
                    <Spacer />
                    {price > 0 && (
                        <VStack>
                            <SatoshiBalance size={18} color={"#ffffff"} satoshis={price} />
                            <Text color={secondaryTextcolor} fontSize="lg" textAlign="right">
                                /{dimension}
                            </Text>
                        </VStack>
                    )}
                </HStack>
            </TouchableOpacityOptional>
        </StopPropagation>
    )
}

export default EvseButton
