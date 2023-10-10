import BusyButton from "components/BusyButton"
import FiatBalance from "components/FiatBalance"
import HeaderBackButton from "components/HeaderBackButton"
import SatoshiBalance from "components/SatoshiBalance"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { Text, useColorModeValue, useTheme, VStack } from "native-base"
import { useConfetti } from "providers/ConfettiProvider"
import React, { useEffect, useLayoutEffect, useState } from "react"
import { View } from "react-native"
import { RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { PaymentStatus } from "types/payment"
import { toNumber, toSatoshi } from "utils/conversion"
import I18n from "utils/i18n"
import { Log } from "utils/logging"
import styles from "utils/styles"

const log = new Log("PaymentRequest")

type PaymentRequestProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "PaymentRequest">
    route: RouteProp<AppStackParamList, "PaymentRequest">
}

const PaymentRequest = ({ navigation, route }: PaymentRequestProps) => {
    const { startConfetti } = useConfetti()
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const focusBackgroundColor = useColor(colors.dark[400], colors.warmGray[200])
    const errorColor = useColorModeValue("error.300", "error.500")
    const primaryTextColor = useColor(colors.lightText, colors.darkText)
    const secondaryTextColor = useColor(colors.warmGray[400], colors.dark[200])
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const { paymentStore } = useStore()
    const [amount, setAmount] = useState<number>()
    const [isBusy, setIsBusy] = useState(false)
    const [isDisabled, setIsDisabled] = useState(false)
    const [lastError, setLastError] = useState("")
    const [payReq] = useState(route.params.payReq)
    const [lnInvoice] = useState(route.params.lnInvoice)
    const { channelStore, settingStore, uiStore } = useStore()

    const onClose = () => {
        uiStore.clearPaymentRequest()
        navigation.navigate("Home")
    }

    const onConfirmPress = async () => {
        setIsBusy(true)
        setLastError("")

        try {
            const payment = await paymentStore.sendPayment(payReq)

            if (payment.status === PaymentStatus.SUCCEEDED) {
                await startConfetti()
                onClose()
            } else if (payment.status === PaymentStatus.FAILED && payment.failureReasonKey) {
                setLastError(I18n.t(payment.failureReasonKey))
            }
        } catch (error) {
            setLastError(I18n.t("PaymentFailure_NoRoute"))
            log.debug(`SAT011 onConfirmPress: Error sending payment: ${error}`, true)
        }

        setIsBusy(false)
    }

    useEffect(() => {
        if (amount) {
            setIsDisabled(channelStore.balance < amount)
            setLastError(channelStore.balance < amount ? I18n.t("PaymentFailure_InsufficientBalance") : "")
        }
    }, [amount])

    useEffect(() => {
        if (lnInvoice.amountMsat) {
            setAmount(toNumber(toSatoshi(lnInvoice.amountMsat)))
        }
    }, [lnInvoice.amountMsat])

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => <HeaderBackButton tintColor={navigationOptions.headerTintColor} onPress={onClose} />,
            title: I18n.t("PaymentRequest_HeaderTitle")
        })
    }, [navigation])

    return (
        <View style={[styles.matchParent, { backgroundColor: focusBackgroundColor }]}>
            <View style={[styles.focusViewPanel, { backgroundColor }]}>
                <VStack space={5}>
                    {!!amount && (
                        <View style={{ backgroundColor, alignItems: "center" }}>
                            <SatoshiBalance size={36} color={primaryTextColor} satoshis={amount} />
                            {settingStore.selectedFiatCurrency && <FiatBalance color={secondaryTextColor} size={18} satoshis={amount} />}
                        </View>
                    )}
                    {!!lnInvoice.description && lnInvoice.description.length > 0 && (
                        <Text color={primaryTextColor} fontSize="lg">
                            {lnInvoice.description}
                        </Text>
                    )}
                    {lastError.length > 0 && <Text color={errorColor}>{lastError}</Text>}
                    <BusyButton isBusy={isBusy} isDisabled={isDisabled} onPress={onConfirmPress}>
                        {I18n.t("Button_Next")}
                    </BusyButton>
                </VStack>
            </View>
        </View>
    )
}

export default observer(PaymentRequest)
