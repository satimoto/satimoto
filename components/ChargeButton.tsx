import SatoshiBalance from "components/SatoshiBalance"
import { Button } from "native-base"
import React from "react"
import { LayoutChangeEvent, StyleSheet } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { LightningIcon } from "@bitcoin-design/bitcoin-icons-react-native/outline"

const styleSheet = StyleSheet.create({
    button: {
        position: "absolute",
        flexDirection: "row"
    },
    icon: {
        marginLeft: 5,
        fontWeight: "600"
    }
})

interface ChargeButtonProps {
    satoshis: number
    top?: number
    onLayout?: (event: LayoutChangeEvent) => void
    onPress?: () => void
}

const ChargeButton = ({ satoshis, top, onLayout = () => {}, onPress = () => {}, ...props }: ChargeButtonProps) => {
    const safeAreaInsets = useSafeAreaInsets()
    top = top || safeAreaInsets.top

    return (
        <Button
            borderRadius="full"
            size="lg"
            padding={2}
            colorScheme="orange"
            style={[{ top: 20 + top, right: 10 + safeAreaInsets.right }, styleSheet.button]}
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
