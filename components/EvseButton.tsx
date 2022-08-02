import ButtonIcon from "components/ButtonIcon"
import EvseBadge from "components/EvseBadge"
import SatoshiBalance from "components/SatoshiBalance"
import StopPropagation from "components/StopPropagation"
import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import useColor from "hooks/useColor"
import ConnectorModel from "models/Connector"
import EvseModel from "models/Evse"
import { HStack, Spacer, Text, useColorModeValue, useTheme, VStack } from "native-base"
import React from "react"
import { StyleSheet } from "react-native"
import { connectorIcons } from "utils/assets"
import I18n from "utils/i18n"
import styles from "utils/styles"

const styleSheet = StyleSheet.create({
    buttonIcon: {
        alignItems: "flex-end",
        justifyContent: "flex-start"
    }
})

interface EvseButtonProps {
    connector: ConnectorModel
    evse: EvseModel
    onPress?: (connector: ConnectorModel, evse: EvseModel) => void
}

const EvseButton = ({ connector, evse, onPress = () => {} }: EvseButtonProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.gray[500], colors.warmGray[50])

    return (
        <StopPropagation>
            <TouchableOpacityOptional onPress={() => onPress(connector, evse)} style={[styles.listButton, { backgroundColor }]}>
                <HStack alignItems="center" space={1}>
                    <ButtonIcon source={connectorIcons[connector.standard] || connectorIcons["UNKNOWN"]} style={styleSheet.buttonIcon}>
                        <EvseBadge evse={evse} />
                    </ButtonIcon>
                    <VStack>
                        <Text color={useColorModeValue("lightText", "darkText")} fontSize="lg" fontWeight="bold">
                            {evse.identifier || evse.uid}
                        </Text>
                        <Text color={useColorModeValue("warmGray.200", "dark.200")} fontSize="lg">
                            {I18n.t(evse.status)}
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

export default EvseButton
