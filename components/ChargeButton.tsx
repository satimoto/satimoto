import SatoshiBalance from "components/SatoshiBalance"
import { Button } from "native-base"
import React, { useEffect, useState } from "react"
import { LayoutChangeEvent, StyleSheet } from "react-native"
import { LightningIcon } from "@bitcoin-design/bitcoin-icons-react-native/outline"
import { observer } from "mobx-react"
import { useStore } from "hooks/useStore"
import { ChargeSessionStatus } from "types/chargeSession"

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
    onLayout?: (event: LayoutChangeEvent) => void
    onPress?: () => void
}

const ChargeButton = ({ onLayout = () => {}, onPress = () => {}, ...props }: ChargeButtonProps) => {
    const [chargeBalanceSat, setChargeBalanceSat] = useState(0)
    const { sessionStore } = useStore()

    useEffect(() => {
        setChargeBalanceSat(parseInt(sessionStore.valueSat))
    }, [sessionStore.valueSat])

    return (
        <Button
            borderRadius="full"
            size="lg"
            padding={2}
            colorScheme={sessionStore.status === ChargeSessionStatus.AWAITING_PAYMENT ? "red" : "orange"}
            style={styleSheet.button}
            onLayout={onLayout}
            onPress={onPress}
            {...props}
        >
            <SatoshiBalance size={24} paddingSize={30} color={"#ffffff"} satoshis={chargeBalanceSat}>
                <LightningIcon color="#ffffff" size={30} style={styleSheet.icon} />
            </SatoshiBalance>
        </Button>
    )
}

export default observer(ChargeButton)
