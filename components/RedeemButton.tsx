import SatoshiBalance from "components/SatoshiBalance"
import { Button } from "native-base"
import React, { useEffect, useState } from "react"
import { LayoutChangeEvent, StyleSheet } from "react-native"
import { ClockIcon, WalletIcon } from "@bitcoin-design/bitcoin-icons-react-native/outline"
import { observer } from "mobx-react"
import { useStore } from "hooks/useStore"
import { MIN_EMERGENCY_SAT } from "utils/constants"

const styleSheet = StyleSheet.create({
    button: {
        flexDirection: "row"
    },
    icon: {
        marginLeft: 5,
        fontWeight: "600"
    }
})

interface RedeemButtonProps {
    onLayout?: (event: LayoutChangeEvent) => void
    onPress?: () => void
}

const RedeemButton = ({ onLayout = () => {}, onPress = () => {}, ...props }: RedeemButtonProps) => {
    const [redeemBalanceSat, setRedeemBalanceSat] = useState(0)
    const { walletStore } = useStore()

    useEffect(() => {
        setRedeemBalanceSat(walletStore.confirmedBalance + walletStore.unconfirmedBalance)
    }, [walletStore.confirmedBalance, walletStore.unconfirmedBalance])

    return (
        <Button
            borderRadius="full"
            size="lg"
            padding={2}
            colorScheme="red"
            style={styleSheet.button}
            isDisabled={walletStore.confirmedBalance <= MIN_EMERGENCY_SAT}
            onLayout={onLayout}
            onPress={onPress}
            {...props}
        >
            <SatoshiBalance size={24} paddingSize={30} color={"#ffffff"} satoshis={redeemBalanceSat}>
                {walletStore.confirmedBalance > MIN_EMERGENCY_SAT ? (
                    <WalletIcon color="#ffffff" size={30} style={styleSheet.icon} />
                ) : (
                    <ClockIcon color="#ffffff" size={30} style={styleSheet.icon} />
                )}
            </SatoshiBalance>
        </Button>
    )
}

export default observer(RedeemButton)
