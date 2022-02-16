import SatoshiBalance from "components/SatoshiBalance"
import React from "react"
import { StyleSheet } from "react-native"
import LinearGradient from "react-native-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const styles = StyleSheet.create({
    linearGradient: {
        position: "absolute",
        minHeight: 100,
        borderRadius: 16,
        padding: 10,
        paddingVertical: 20
    }
})

const BalanceCard = () => {
    const safeAreaInsets = useSafeAreaInsets()

    return (
        <LinearGradient
            colors={["#0099ff", "#c1b"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={[{ top: 10 + safeAreaInsets.top, left: 10 + safeAreaInsets.left, right: 10 + safeAreaInsets.right }, styles.linearGradient]}
        >
            <SatoshiBalance size={38} color={"#ffffff"} />
        </LinearGradient>
    )
}

export default BalanceCard
