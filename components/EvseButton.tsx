import ButtonIcon from "components/ButtonIcon"
import EvseBadge from "components/EvseBadge"
import SatoshiBalance from "components/SatoshiBalance"
import StopPropagation from "components/StopPropagation"
import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import useColor from "hooks/useColor"
import ConnectorModel, { ConnectorGroup } from "models/Connector"
import EvseModel from "models/Evse"
import { calculateTotalPrice, getPriceComponentByType, getPriceComponents } from "models/PriceComponent"
import { HStack, Spacer, Text, useColorModeValue, useTheme, VStack } from "native-base"
import React, { useCallback, useEffect, useState } from "react"
import { TariffDimension } from "types/tariff"
import { toNumber, toSatoshi } from "utils/conversion"
import { connectorIcons } from "utils/assets"
import I18n from "utils/i18n"
import styles from "utils/styles"

interface EvseButtonProps {
    connectorGroup: ConnectorGroup
    evse: EvseModel
    onPress?: (connector: ConnectorModel, evse: EvseModel) => void
}

const EvseButton = ({ connectorGroup, evse, onPress = () => {} }: EvseButtonProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.gray[500], colors.warmGray[50])
    const primaryTextColor = useColorModeValue("lightText", "darkText")
    const secondaryTextColor = useColorModeValue("warmGray.200", "dark.200")
    const [connector, setConnector] = useState<ConnectorModel>()
    const [dimension, setDimension] = useState("")
    const [price, setPrice] = useState(0)
    const [tariff] = useState(connectorGroup.tariff)

    const onButtonPress = useCallback(() => {
        if (connector) {
            onPress(connector, evse)
        }
    }, [connector, evse])

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
    }, [tariff])

    useEffect(() => {
        const evseConnector = evse.connectors.find(
            (connector) => connectorGroup.standard === connector.standard && connectorGroup.wattage === connector.wattage
        )

        if (evseConnector) {
            setConnector(evseConnector)
        }
    }, [connectorGroup, evse])

    return (
        <StopPropagation>
            <TouchableOpacityOptional onPress={onButtonPress} style={[styles.listButton, { backgroundColor }]}>
                <HStack alignItems="center" space={1}>
                    <ButtonIcon source={connectorIcons[connectorGroup.standard] || connectorIcons["UNKNOWN"]} style={styles.buttonIcon}>
                        <EvseBadge evse={evse} />
                    </ButtonIcon>
                    <VStack flexBasis={0} flexGrow={12}>
                        <Text color={primaryTextColor} fontSize="lg" fontWeight="bold">
                            {evse.identifier || evse.uid}
                        </Text>
                        <Text color={secondaryTextColor} fontSize="lg">
                            {I18n.t(evse.status)}
                        </Text>
                    </VStack>
                    <Spacer />
                    {price > 0 && (
                        <VStack>
                            <SatoshiBalance size={18} color={"#ffffff"} satoshis={price} />
                            <Text color={secondaryTextColor} fontSize="lg" textAlign="right">
                                /{dimension}*
                            </Text>
                        </VStack>
                    )}
                </HStack>
            </TouchableOpacityOptional>
        </StopPropagation>
    )
}

export default EvseButton
