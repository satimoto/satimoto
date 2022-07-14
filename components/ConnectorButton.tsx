import ButtonIcon from "components/ButtonIcon"
import SatoshiBalance from "components/SatoshiBalance"
import StopPropagation from "components/StopPropagation"
import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import useColor from "hooks/useColor"
import EvseModel from "models/Evse"
import ConnectorModel from "models/Connector"
import { HStack, Spacer, Text, useColorModeValue, useTheme, VStack } from "native-base"
import React from "react"
import { connectorIcons } from "utils/assets"
import I18n from "utils/i18n"
import styles from "utils/styles"

interface ConnectorButtonProps {
    connector: ConnectorModel
    evses: EvseModel[]
    onPress?: (connector: ConnectorModel, evses: EvseModel[]) => void
    onPressIn?: () => void
    onPressOut?: () => void
}

const ConnectorButton = ({ connector, evses, onPress = () => {}, onPressIn = () => {}, onPressOut = () => {} }: ConnectorButtonProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.gray[500], colors.warmGray[50])

    return (
        <StopPropagation>
            <TouchableOpacityOptional
                onPress={() => onPress(connector, evses)}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={[styles.listButton, { backgroundColor }]}
            >
                <HStack alignItems="center" space={1}>
                    <ButtonIcon justifyContent="flex-end" source={connectorIcons[connector.standard] || connectorIcons["UNKNOWN"]} />
                    <VStack>
                        <Text color={useColorModeValue("lightText", "darkText")} fontSize="lg" fontWeight="bold">
                            {I18n.t(connector.standard)}
                        </Text>
                        <Text color={useColorModeValue("warmGray.200", "dark.200")} fontSize="lg">
                            {Math.floor(connector.wattage / 1000)} kW
                        </Text>
                    </VStack>
                    <Spacer />
                    <VStack>
                        <SatoshiBalance size={18} color={"#ffffff"} satoshis={Math.floor(connector.voltage * 29)} />
                        <Text color={useColorModeValue("warmGray.200", "dark.200")} fontSize="lg" textAlign="right">
                            /kWh
                        </Text>
                    </VStack>
                </HStack>
            </TouchableOpacityOptional>
        </StopPropagation>
    )
}

export default ConnectorButton
