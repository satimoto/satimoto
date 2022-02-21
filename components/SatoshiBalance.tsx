import { SatoshiV2Icon } from "@bitcoin-design/bitcoin-icons-react-native/outline"
import React, { PropsWithChildren } from "react"
import { StyleSheet, Text, View } from "react-native"
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
    color?: string,
    satoshis: number
}

const SatoshiBalance = ({ size = 38, color = "#FFFFFF", satoshis }: SatoshiBalanceProps) => {
    const padding = size / 5

    return (
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                <View style={{ paddingTop: padding / 2 }}>
                    <SatoshiV2Icon color={color} size={size - padding} />
                </View>
                <Text style={[styles.text, { fontSize: size, color: color }]}>{formatSatoshis(satoshis)}</Text>
            </View>
    )
}

export default SatoshiBalance
