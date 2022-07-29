import BusyButton from "components/BusyButton"
import HeaderBackButton from "components/HeaderBackButton"
import Input from "components/Input"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { FormControl, Text, useColorModeValue, useTheme, VStack, WarningOutlineIcon } from "native-base"
import React, { useEffect, useLayoutEffect, useState } from "react"
import { View } from "react-native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { decodePayReq } from "services/LightningService"
import { getMetadataElement, payRequest } from "services/LnUrlService"
import { assertNetwork } from "utils/assert"
import { errorToString, toHashOrNull, toMilliSatoshi, toNumber, toSatoshi, toStringOrNull } from "utils/conversion"
import { formatSatoshis } from "utils/format"
import I18n from "utils/i18n"
import { Log } from "utils/logging"
import styles from "utils/styles"
import { useConfetti } from "providers/ConfettiProvider"
import { RouteProp } from "@react-navigation/native"

const log = new Log("LnUrlPay")

type LnUrlPayProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "LnUrlPay">
    route: RouteProp<AppStackParamList, "LnUrlPay">
}

const LnUrlPay = ({ navigation, route }: LnUrlPayProps) => {
    const { startConfetti } = useConfetti()
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const errorColor = useColorModeValue("error.300", "error.500")
    const textColor = useColorModeValue("lightText", "darkText")
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const { channelStore, paymentStore, uiStore } = useStore()
    const [amountString, setAmountString] = useState("")
    const [amountNumber, setAmountNumber] = useState(0)
    const [description, setDescription] = useState("")
    const [isBusy, setIsBusy] = useState(false)
    const [isInvalid, setIsInvalid] = useState(false)
    const [lastError, setLastError] = useState("")
    const [maxSendable, setMaxSendable] = useState(0)
    const [minSendable, setMinSendable] = useState(0)
    const [metadataHash, setMetadataHash] = useState<string | null>(null)
    const [amountError, setAmountError] = useState("")

    const onClose = () => {
        uiStore.clearLnUrl()
        navigation.navigate("Home")
    }

    const onAmountChange = (text: string) => {
        setAmountString(text)
        setAmountNumber(+text)
    }

    const onConfirmPress = async () => {
        setIsBusy(true)
        setLastError("")

        if (uiStore.lnUrlPayParams && uiStore.lnUrlPayParams.callback) {
            try {
                const response = await payRequest(uiStore.lnUrlPayParams.callback, toMilliSatoshi(amountString).toString())
                assertNetwork(response.pr)

                const decodedPayReq = await decodePayReq(response.pr)
                log.debug(`Metadata hash: ${metadataHash}`)
                log.debug(`Payment Request hash: ${decodedPayReq.descriptionHash}`)

                if (decodedPayReq.descriptionHash === metadataHash && toNumber(decodedPayReq.numSatoshis) === amountNumber) {
                    // Pay
                    await paymentStore.sendPayment({ paymentRequest: response.pr })
                    await startConfetti()
                    onClose()
                } else {
                    setLastError(I18n.t("LnUrlPay_PayReqError"))
                }
            } catch (error) {
                setLastError(errorToString(error))
                log.debug(`Error getting pay request: ${error}`)
            }
        }

        setIsBusy(false)
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <HeaderBackButton
                    tintColor={navigationOptions.headerTintColor}
                    onPress={onClose}
                />
            ),
            title: I18n.t("LnUrlPay_HeaderTitle")
        })
    }, [navigation])

    useEffect(() => {
        const payParams = route.params.payParams
        let maxSats = toSatoshi(payParams.maxSendable).toNumber()
        let minSats = toSatoshi(payParams.minSendable).toNumber()

        if (maxSats > channelStore.localBalance) {
            maxSats = channelStore.localBalance
        }

        setDescription(getMetadataElement(payParams.decodedMetadata, "text/plain") || "")
        setMaxSendable(maxSats)
        setMinSendable(minSats)
        setMetadataHash(toStringOrNull(toHashOrNull(payParams.metadata)))
        setAmountError(I18n.t("LnUrlPay_AmountError", { minSats: formatSatoshis(minSats), maxSats: formatSatoshis(maxSats) }))
    }, [route.params.payParams])

    useEffect(() => {
        setIsInvalid(amountNumber < minSendable || amountNumber > maxSendable)
    }, [amountNumber])

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            <VStack space={5}>
                {description.length > 0 && (
                    <Text color={textColor} fontSize="lg">
                        {description}
                    </Text>
                )}
                <FormControl isInvalid={isInvalid} isRequired={true}>
                    <FormControl.Label _text={{ color: textColor }}>Amount</FormControl.Label>
                    <Input value={amountString} keyboardType="number-pad" onChangeText={onAmountChange} />
                    {!isInvalid && <FormControl.HelperText>{amountError}</FormControl.HelperText>}
                    <FormControl.ErrorMessage _text={{ color: errorColor }} leftIcon={<WarningOutlineIcon size="xs" />}>
                        {amountError}
                    </FormControl.ErrorMessage>
                </FormControl>
                {lastError.length > 0 && <Text color={errorColor}>{lastError}</Text>}
                <BusyButton isBusy={isBusy} onPress={onConfirmPress} isDisabled={isInvalid}>
                    {I18n.t("Button_Next")}
                </BusyButton>
            </VStack>
        </View>
    )
}

export default observer(LnUrlPay)
