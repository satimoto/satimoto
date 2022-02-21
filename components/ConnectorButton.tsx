import SatoshiBalance from "components/SatoshiBalance"
import Connector from "models/Connector"
import { Box, HStack, Pressable, Spacer, Text, VStack } from "native-base"
import React from "react"
import { Image } from "react-native"

const connectorIcons: any = {
    "0": require("assets/unknown.png"),
    "2": require("assets/chademo.png"),
    "25": require("assets/type2_socket.png"),
    "28": require("assets/schuko.png"),
    "33": require("assets/type2_ccs.png")
}

interface ConnectorButtonProps {
    connector: Connector
    onPress?: (connector: Connector) => void
}

const ConnectorButton = ({ connector, onPress }: ConnectorButtonProps) => {
    return (
        <Pressable onPress={() => onPress && onPress(connector)}>
            <Box bg="gray.500" p={2} rounded={12}>
                <HStack alignItems="center" space={1}>
                    <Image
                        resizeMode="contain"
                        source={connectorIcons[connector.connectorId] || connectorIcons[0]}
                        style={{ width: 50, height: 50 }}
                    />
                    <VStack>
                        <Text color="white" fontSize="lg" fontWeight="bold">
                            {connector.title}
                        </Text>
                        <Text color="gray.300" fontSize="lg">
                            {connector.currentType}
                        </Text>
                    </VStack>
                    <Spacer/>
                    <VStack>
                        <SatoshiBalance size={18} color={"#ffffff"} satoshis={Math.floor(connector.voltage * 29)} />
                        <Text color="gray.300" fontSize="lg" textAlign="right">
                            /kWh
                        </Text>
                    </VStack>
                </HStack>
            </Box>
        </Pressable>
    )
}

export default ConnectorButton
