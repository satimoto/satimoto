import { SatoshiV2Icon } from "@bitcoin-design/bitcoin-icons-react-native/outline"
import React, { PropsWithChildren } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { store } from "stores/Store"
import { formatSatoshis } from "utils/format"
import { Log } from "utils/logging"

const log = new Log("SatoshiBalance")

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
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                <View style={{ paddingTop: padding / 2 }}>
                    <SatoshiV2Icon color={color} size={size - padding} />
                </View>
                <Text style={[styles.text, { fontSize: size, color: color }]}>{formatSatoshis(store.channelStore.localBalance)}</Text>
            </View>
    )
}

export default SatoshiBalance
