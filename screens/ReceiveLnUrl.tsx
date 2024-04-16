import HeaderBackButton from "components/HeaderBackButton"
import NfcTransmitter from "components/NfcTransmitter"
import QrCode from "components/QrCode"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { observer } from "mobx-react"
import { useTheme } from "native-base"
import React, { useEffect, useLayoutEffect, useState } from "react"
import { Dimensions, Share, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { IS_ANDROID } from "utils/constants"
import I18n from "utils/i18n"
import styles from "utils/styles"
import { useStore } from "hooks/useStore"

const styleSheet = StyleSheet.create({
    container: { padding: 10, alignItems: "center", justifyContent: "space-between" }
})

type ReceiveLnUrlProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "ReceiveLnUrl">
}

const ReceiveLnUrl = ({ navigation }: ReceiveLnUrlProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const safeAreaInsets = useSafeAreaInsets()
    const [intent, setIntent] = useState("")
    const { lightningStore, uiStore } = useStore()

    const size = Dimensions.get("window").width - 20

    const onPress = async () => {
        await Share.share({ message: intent })
    }

    const onClose = () => {
        navigation.navigate("Home")
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => <HeaderBackButton tintColor={navigationOptions.headerTintColor} onPress={onClose} />,
            title: I18n.t("ReceiveLnUrl_HeaderTitle")
        })
    }, [navigation])

    useEffect(() => {
        setIntent(`lnurlp:${lightningStore.lnurlPayUrl}`)
    }, [lightningStore.lnurlPayUrl])

    return (
        <View style={[styles.matchParent, styleSheet.container, { backgroundColor, paddingBottom: safeAreaInsets.bottom }]}>
            {lightningStore.lnurlPayUrl && (
                <View style={{ alignItems: "center" }}>
                    <QrCode value={lightningStore.lnurlPayUrl} color="white" backgroundColor={backgroundColor} onPress={onPress} size={size} />
                    {IS_ANDROID && uiStore.nfcAvailable && <NfcTransmitter value={intent} size={30} />}
                </View>
            )}
        </View>
    )
}

export default observer(ReceiveLnUrl)
