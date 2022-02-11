import { SatoshiV2Icon } from "@bitcoin-design/bitcoin-icons-react-native/outline"
import React, { PropsWithChildren } from "react"
import { StyleSheet, Text, View } from "react-native"
import { store } from "stores/Store"
import { formatSatoshis } from "utils/format"

const styles = StyleSheet.create({
    text: {
        fontWeight: "600"
    }
})

interface SatoshiBalanceProps extends PropsWithChildren<any> {
    size?: number
    color?: string
}

const SatoshiBalance = ({ size = 38, color = "#FFFFFF" }: SatoshiBalanceProps) => {
    const padding = size / 5

    return (
        <View style={{ flex: 1, flexDirection: "row" }}>
            <View style={{ paddingTop: padding }}>
                <SatoshiV2Icon color={color} size={size - padding} />
            </View>
            <Text style={[styles.text, { fontSize: size, color: color }]}>{formatSatoshis(store.channelStore.localBalance)}</Text>
        </View>
    )
}

export default SatoshiBalance
