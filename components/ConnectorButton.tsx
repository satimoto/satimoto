import SatoshiBalance from "components/SatoshiBalance"
import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import useColor from "hooks/useColor"
import ConnectorModel from "models/Connector"
import { HStack, Spacer, Text, useColorModeValue, useTheme, VStack } from "native-base"
import React from "react"
import { Image, StyleSheet } from "react-native"

const styleSheet = StyleSheet.create({
    touchableOpacity: {
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 12
    }
})

const connectorIcons: any = {
    "CHADEMO": require("assets/CHADEMO.png"),
    "DOMESTIC_F": require("assets/DOMESTIC_F.png"),
    "IEC_62196_T1": require("assets/IEC_62196_T1.png"),
    "IEC_62196_T1_COMBO": require("assets/IEC_62196_T1_COMBO.png"),
    "IEC_62196_T2": require("assets/IEC_62196_T2.png"),
    "IEC_62196_T2_COMBO": require("assets/IEC_62196_T2_COMBO.png"),
    "UNKNOWN": require("assets/UNKNOWN.png")
}

interface ConnectorButtonProps {
    connector: ConnectorModel
    onPress?: (connector: ConnectorModel) => void
}

const ConnectorButton = ({ connector, onPress = () => {} }: ConnectorButtonProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.gray[500], colors.warmGray[50])

    return (
        <TouchableOpacityOptional onPress={() => onPress(connector)} style={[styleSheet.touchableOpacity, { backgroundColor }]}>
            <HStack alignItems="center" space={1}>
                <Image resizeMode="contain" source={connectorIcons[connector.standard] || connectorIcons["UNKNOWN"]} style={{ width: 50, height: 50 }} />
                <VStack>
                    <Text color={useColorModeValue("lightText", "darkText")} fontSize="lg" fontWeight="bold">
                        {connector.standard}
                    </Text>
                    <Text color={useColorModeValue("warmGray.200", "dark.200")} fontSize="lg">
                        {connector.powerType}
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
    )
}

export default ConnectorButton
