import React from "react"
import { Text, View } from "react-native"
import { useTheme } from "@react-navigation/native"

const Wallet = () => {
    const { colors } = useTheme()

    return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
            <Text style={{ color: colors.text }}>Wallet</Text>
        </View>
    )
}

export default Wallet
