import SatoshiBalance from "components/SatoshiBalance"
import React, { PropsWithChildren } from "react"
import { StyleSheet } from "react-native"
import LinearGradient from "react-native-linear-gradient"

const styles = StyleSheet.create({
    linearGradient: {
        margin: 10,
        marginTop: 0,
        height: 100,
        borderRadius: 15,
        padding: 10,
        paddingVertical: 20
    }
})

interface BalanceCardProps extends PropsWithChildren<any> {
    style?: any
}

const BalanceCard = ({ style = {} }: BalanceCardProps) => (
    <LinearGradient colors={["#0099ff", "#c1b"]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={[style, styles.linearGradient]}>
        <SatoshiBalance size={38} color={"#ffffff"} />
    </LinearGradient>
)

export default BalanceCard
