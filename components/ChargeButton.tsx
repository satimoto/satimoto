import SatoshiBalance from "components/SatoshiBalance"
import { Button } from "native-base"
import React from "react"
import { LayoutChangeEvent, StyleSheet } from "react-native"
import { LightningIcon } from "@bitcoin-design/bitcoin-icons-react-native/outline"

const styleSheet = StyleSheet.create({
    button: {
        flexDirection: "row"
    },
    icon: {
        marginLeft: 5,
        fontWeight: "600"
    }
})

interface ChargeButtonProps {
    satoshis: number
    onLayout?: (event: LayoutChangeEvent) => void
    onPress?: () => void
}

const ChargeButton = ({ satoshis, onLayout = () => {}, onPress = () => {}, ...props }: ChargeButtonProps) => {
    return (
        <Button
            borderRadius="full"
            size="lg"
            padding={2}
            colorScheme="orange"
            style={styleSheet.button}
            onLayout={onLayout}
            onPress={onPress}
            {...props}
        >
            <SatoshiBalance size={24} paddingSize={30} color={"#ffffff"} satoshis={satoshis}>
                <LightningIcon color="#ffffff" size={30} style={styleSheet.icon} />
            </SatoshiBalance>
        </Button>
    )
}

export default ChargeButton
