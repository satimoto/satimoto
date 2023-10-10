import FiatBalance from "components/FiatBalance"
import SatoshiBalance from "components/SatoshiBalance"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faGear } from "@fortawesome/free-solid-svg-icons"
import { observer } from "mobx-react"
import { IconButton } from "native-base"
import React from "react"
import { LayoutChangeEvent, StyleSheet } from "react-native"
import LinearGradient from "react-native-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { useStore } from "hooks/useStore"
import { HomeNavigationProp } from "screens/Home"

const styleSheet = StyleSheet.create({
    linearGradient: {
        position: "absolute",
        minHeight: 100,
        borderRadius: 16,
        padding: 10,
        paddingtop: 20,
        justifyContent: "center"
    },
    settingsButton: {
        position: "absolute",
        borderColor: "#ffffff",
        top: 10,
        right: 10
    }
})

interface BalanceCardProps {
    onLayout?: (event: LayoutChangeEvent) => void
}

const BalanceCard = ({ onLayout = () => {} }: BalanceCardProps) => {
    const navigation = useNavigation<HomeNavigationProp>()
    const safeAreaInsets = useSafeAreaInsets()
    const { channelStore, settingStore } = useStore()

    return (
        <LinearGradient
            colors={["#0099ff", "#c1b"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={[{ top: 10 + safeAreaInsets.top, left: 10 + safeAreaInsets.left, right: 10 + safeAreaInsets.right }, styleSheet.linearGradient]}
            onLayout={onLayout}
        >
            <SatoshiBalance size={38} color={"#ffffff"} satoshis={channelStore.balance} />
            {settingStore.selectedFiatCurrency && <FiatBalance size={18} satoshis={channelStore.balance} style={{ marginTop: 5, marginLeft: 5 }} />}
            <IconButton
                variant="outline"
                borderRadius="xl"
                onPress={() => navigation.navigate("Settings")}
                icon={<FontAwesomeIcon icon={faGear} />}
                _icon={{ color: "#ffffff" }}
                style={styleSheet.settingsButton}
            />
        </LinearGradient>
    )
}

export default observer(BalanceCard)
