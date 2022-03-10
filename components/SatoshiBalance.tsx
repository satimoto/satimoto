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
    appendText?: string
    color?: string
    prependText?: string
    satoshis: number
    size?: number
}

const SatoshiBalance = ({ size = 38, color = "#FFFFFF", satoshis, appendText, prependText }: SatoshiBalanceProps) => {
    const padding = size / 5

    return (
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
            {prependText && <Text style={[styles.text, { fontSize: size, color: color }]}>{prependText + " "}</Text>}
            <View style={{ paddingTop: padding / 2 }}>
                <SatoshiV2Icon color={color} size={size - padding} />
            </View>
            <Text style={[styles.text, { fontSize: size, color: color }]}>
                {formatSatoshis(satoshis)}
                {appendText ? " " + appendText : ""}
            </Text>
        </View>
    )
}

export default SatoshiBalance
