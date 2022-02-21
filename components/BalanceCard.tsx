import SatoshiBalance from "components/SatoshiBalance"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faListCheck } from "@fortawesome/free-solid-svg-icons"
import { IconButton } from "native-base"
import React from "react"
import { StyleSheet } from "react-native"
import LinearGradient from "react-native-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { store } from "stores/Store"

const styleSheet = StyleSheet.create({
    linearGradient: {
        position: "absolute",
        minHeight: 100,
        borderRadius: 16,
        padding: 10,
        paddingVertical: 20
    },
    transactionsButton: {
        position: "absolute",
        borderColor: "#ffffff",
        top: 10,
        right: 10
    }
})

const BalanceCard = () => {
    const safeAreaInsets = useSafeAreaInsets()

    return (
        <LinearGradient
            colors={["#0099ff", "#c1b"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={[{ top: 10 + safeAreaInsets.top, left: 10 + safeAreaInsets.left, right: 10 + safeAreaInsets.right }, styleSheet.linearGradient]}
        >
            <SatoshiBalance size={38} color={"#ffffff"} satoshis={store.channelStore.localBalance} />
            <IconButton
                variant="outline"
                borderRadius="xl"
                icon={<FontAwesomeIcon icon={faListCheck} />}
                _icon={{ color: "#ffffff" }}
                style={styleSheet.transactionsButton}
            />
        </LinearGradient>
    )
}

export default BalanceCard
