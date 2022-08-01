import HeaderBackButton from "components/HeaderBackButton"
import NfcTransmitter from "components/NfcTransmitter"
import QrCode from "components/QrCode"
import SatoshiBalance from "components/SatoshiBalance"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { observer } from "mobx-react"
import moment from "moment"
import { Text, useTheme } from "native-base"
import { useConfetti } from "providers/ConfettiProvider"
import React, { useEffect, useLayoutEffect, useState } from "react"
import { Dimensions, Share, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { InvoiceStatus } from "types/invoice"
import { INTERVAL_MINUTE, IS_ANDROID } from "utils/constants"
import I18n from "utils/i18n"
import styles from "utils/styles"
import { doWhile } from "utils/tools"

type WaitForPaymentProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "WaitForPayment">
    route: RouteProp<AppStackParamList, "WaitForPayment">
}

const WaitForPayment = ({ navigation, route }: WaitForPaymentProps) => {
    const { startConfetti } = useConfetti()
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const textColor = useColor(colors.lightText, colors.darkText)
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const safeAreaInsets = useSafeAreaInsets()
    const [invoice] = useState(route.params.invoice)
    const [expiryMinutes, setExpiryMinutes] = useState(60)

    const size = Dimensions.get("window").width - 20

    const onPress = async () => {
        await Share.share({ message: `lightning:${invoice.paymentRequest}` })
    }

    const onClose = () => {
        navigation.navigate("Home")
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => <HeaderBackButton tintColor={navigationOptions.headerTintColor} onPress={onClose} />,
            title: I18n.t("WaitForPayment_HeaderTitle")
        })
    }, [navigation])

    useEffect(() => {
        let minutes = moment(invoice.expiresAt).diff(moment(), "minutes")
        const promise = doWhile(
            "Countdown",
            () => {
                minutes--

                setExpiryMinutes(minutes)

                return minutes === 0 ? true : false
            },
            INTERVAL_MINUTE
        )
        promise.finally(onClose)

        return () => {
            promise.cancel()
        }
    }, [invoice.expiresAt])

    useEffect(() => {
        if (invoice.status == InvoiceStatus.SETTLED) {
            startConfetti().then(onClose)
        }
    }, [invoice.status])

    return (
        <View
            style={[
                styles.matchParent,
                { padding: 10, backgroundColor, alignItems: "center", justifyContent: "space-between", paddingBottom: safeAreaInsets.bottom }
            ]}
        >
            <SatoshiBalance size={36} color={textColor} satoshis={parseInt(invoice.valueSat)} />
            <View style={{ alignItems: "center" }}>
                <QrCode value={invoice.paymentRequest} color="white" backgroundColor={backgroundColor} onPress={onPress} size={size} />
                {IS_ANDROID && <NfcTransmitter value={invoice.paymentRequest} size={30} />}
            </View>
            <Text color={textColor} fontSize="xl" paddingTop={IS_ANDROID ? 0 : 4}>
                {expiryMinutes === 1 ? I18n.t("WaitForPayment_Expiry") : I18n.t("WaitForPayment_ExpiryPlural", { minutes: expiryMinutes })}
            </Text>
        </View>
    )
}

export default observer(WaitForPayment)
