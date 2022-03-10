import SatoshiBalance from "components/SatoshiBalance"
import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import useColor from "hooks/useColor"
import ConnectorModel from "models/Connector"
import { HStack, Spacer, Text, useTheme, VStack } from "native-base"
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
    "0": require("assets/unknown.png"),
    "2": require("assets/chademo.png"),
    "25": require("assets/type2_socket.png"),
    "28": require("assets/schuko.png"),
    "33": require("assets/type2_ccs.png")
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
                <Image resizeMode="contain" source={connectorIcons[connector.connectorId] || connectorIcons[0]} style={{ width: 50, height: 50 }} />
                <VStack>
                    <Text color="white" fontSize="lg" fontWeight="bold">
                        {connector.title}
                    </Text>
                    <Text color="gray.300" fontSize="lg">
                        {connector.currentType}
                    </Text>
                </VStack>
                <Spacer />
                <VStack>
                    <SatoshiBalance size={18} color={"#ffffff"} satoshis={Math.floor(connector.voltage * 29)} />
                    <Text color="gray.300" fontSize="lg" textAlign="right">
                        /kWh
                    </Text>
                </VStack>
            </HStack>
        </TouchableOpacityOptional>
    )
}

export default ConnectorButton
