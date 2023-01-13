import BusyButton from "components/BusyButton"
import HeaderBackButton from "components/HeaderBackButton"
import Input from "components/Input"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import InvoiceModel from "models/Invoice"
import { FormControl, Text, useColorModeValue, useTheme, VStack, WarningOutlineIcon } from "native-base"
import { useConfetti } from "providers/ConfettiProvider"
import React, { useEffect, useLayoutEffect, useState } from "react"
import { View } from "react-native"
import { RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { withdrawRequest } from "services/LnUrlService"
import { InvoiceStatus } from "types/invoice"
import { bytesToHex, errorToString, toSatoshi } from "utils/conversion"
import { formatSatoshis } from "utils/format"
import I18n from "utils/i18n"
import { Log } from "utils/logging"
import styles from "utils/styles"

const log = new Log("LnUrlWithdraw")

type LnUrlWithdrawProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "LnUrlWithdraw">
    route: RouteProp<AppStackParamList, "LnUrlWithdraw">
}

const LnUrlWithdraw = ({ navigation, route }: LnUrlWithdrawProps) => {
    const { startConfetti } = useConfetti()
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const focusBackgroundColor = useColor(colors.dark[300], colors.warmGray[200])
    const errorColor = useColorModeValue("error.300", "error.500")
    const textColor = useColorModeValue("lightText", "darkText")
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const { channelStore, invoiceStore, uiStore } = useStore()
    const [amountString, setAmountString] = useState("")
    const [amountNumber, setAmountNumber] = useState(0)
    const [description, setDescription] = useState("")
    const [isBusy, setIsBusy] = useState(false)
    const [isInvalid, setIsInvalid] = useState(false)
    const [lastError, setLastError] = useState("")
    const [maxReceivable, setMaxReceivable] = useState(0)
    const [minReceivable, setMinReceivable] = useState(0)
    const [amountError, setAmountError] = useState("")
    const [invoice, setInvoice] = useState<InvoiceModel>()

    const onClose = () => {
        setIsBusy(false)
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

        if (uiStore.lnUrlWithdrawParams && uiStore.lnUrlWithdrawParams.callback) {
            try {
                const lnInvoice = await invoiceStore.addInvoice({ value: amountNumber, createChannel: true })
                const response = await withdrawRequest(uiStore.lnUrlWithdrawParams.callback, uiStore.lnUrlWithdrawParams.k1, lnInvoice.paymentRequest)

                if (response.status === "OK") {
                    const hash = bytesToHex(lnInvoice.rHash)
                    const invoice = await invoiceStore.waitForInvoice(hash)

                    setInvoice(invoice)
                } else {
                    setLastError(response.reason)
                }
            } catch (error) {
                setLastError(errorToString(error))
                log.debug(`Error getting withdraw request: ${error}`)
                setIsBusy(false)
            }
        }
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => <HeaderBackButton tintColor={navigationOptions.headerTintColor} onPress={onClose} />,
            title: I18n.t("LnUrlWithdraw_HeaderTitle")
        })
    }, [navigation])

    useEffect(() => {
        const withdrawParams = route.params.withdrawParams
        let maxSats = toSatoshi(withdrawParams.maxWithdrawable).toNumber()
        let minSats = toSatoshi(withdrawParams.minWithdrawable).toNumber()

        if (maxSats > channelStore.remoteBalance) {
            maxSats = channelStore.remoteBalance
        }

        setDescription(withdrawParams.defaultDescription)
        setMaxReceivable(maxSats)
        setMinReceivable(minSats)
        setAmountError(I18n.t("LnUrlWithdraw_AmountError", { minSats: formatSatoshis(minSats), maxSats: formatSatoshis(maxSats) }))
    }, [route.params.withdrawParams])

    useEffect(() => {
        setIsInvalid(amountNumber < minReceivable || amountNumber > maxReceivable)
    }, [amountNumber])

    useEffect(() => {
        if (invoice && invoice.status == InvoiceStatus.SETTLED) {
            startConfetti().then(onClose)
        }
    }, [invoice?.status])

    return (
        <View style={[styles.matchParent, { backgroundColor: focusBackgroundColor }]}>
            <View style={[styles.focusViewPanel, { backgroundColor }]}>
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
        </View>
    )
}

export default observer(LnUrlWithdraw)
