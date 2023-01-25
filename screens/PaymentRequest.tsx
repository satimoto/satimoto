import BusyButton from "components/BusyButton"
import HeaderBackButton from "components/HeaderBackButton"
import SatoshiBalance from "components/SatoshiBalance"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { Text, useColorModeValue, useTheme, VStack } from "native-base"
import { useConfetti } from "providers/ConfettiProvider"
import React, { useLayoutEffect, useState } from "react"
import { View } from "react-native"
import { RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { PaymentStatus } from "types/payment"
import { errorToString, toNumber } from "utils/conversion"
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
    const textColor = useColor(colors.lightText, colors.darkText)
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const { paymentStore } = useStore()
    const [isBusy, setIsBusy] = useState(false)
    const [lastError, setLastError] = useState("")
    const [payReq, setPayReq] = useState(route.params.payReq)
    const [decodedPayReq, setDecodedPayReq] = useState(route.params.decodedPayReq)
    const { uiStore } = useStore()

    const onClose = () => {
        uiStore.clearPaymentRequest()
        navigation.navigate("Home")
    }

    const onConfirmPress = async () => {
        setIsBusy(true)
        setLastError("")

        try {
            const payment = await paymentStore.sendPayment({ paymentRequest: payReq })

            if (payment.status === PaymentStatus.SUCCEEDED) {
                await startConfetti()
                onClose()
            } else if (payment.status === PaymentStatus.FAILED && payment.failureReasonKey) {
                setLastError(I18n.t(payment.failureReasonKey))
            }
        } catch (error) {
            setLastError(errorToString(error))
            log.debug(`SAT011 onConfirmPress: Error sending payment: ${error}`, true)
        }

        setIsBusy(false)
    }

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
                    <View style={{ backgroundColor, alignItems: "center" }}>
                        <SatoshiBalance size={36} color={textColor} satoshis={toNumber(decodedPayReq.numSatoshis)} />
                    </View>
                    {decodedPayReq.description.length > 0 && (
                        <Text color={textColor} fontSize="lg">
                            {decodedPayReq.description}
                        </Text>
                    )}
                    {lastError.length > 0 && <Text color={errorColor}>{lastError}</Text>}
                    <BusyButton isBusy={isBusy} onPress={onConfirmPress}>
                        {I18n.t("Button_Next")}
                    </BusyButton>
                </VStack>
            </View>
        </View>
    )
}

export default observer(PaymentRequest)
