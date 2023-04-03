import BusyButton from "components/BusyButton"
import ExpandableInfoItem from "components/ExpandableInfoItem"
import HeaderBackButton from "components/HeaderBackButton"
import Input from "components/Input"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { FormControl, HStack, Text, useColorModeValue, useTheme, VStack, WarningOutlineIcon } from "native-base"
import { useConfetti } from "providers/ConfettiProvider"
import React, { useEffect, useLayoutEffect, useState } from "react"
import { View } from "react-native"
import { RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { tick } from "utils/backoff"
import { errorToString, toSatoshi } from "utils/conversion"
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
    const focusBackgroundColor = useColor(colors.dark[400], colors.warmGray[200])
    const secondaryTextColor = useColorModeValue("warmGray.200", "dark.200")
    const errorColor = useColorModeValue("error.300", "error.500")
    const textColor = useColorModeValue("lightText", "darkText")
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const [amount, setAmount] = useState("")
    const [amountError, setAmountError] = useState("")
    const [amountNumber, setAmountNumber] = useState(0)
    const [channelRequestNeeded, setChannelRequestNeeded] = useState(false)
    const [description, setDescription] = useState("")
    const [isBusy, setIsBusy] = useState(false)
    const [isInvalid, setIsInvalid] = useState(false)
    const [lastError, setLastError] = useState("")
    const [maxReceivable, setMaxReceivable] = useState(0)
    const [minReceivable, setMinReceivable] = useState(0)
    const [openingFee, setOpeningFee] = useState(0)
    const { channelStore, invoiceStore, uiStore } = useStore()

    const onClose = () => {
        setIsBusy(false)
        uiStore.clearLnUrl()
        navigation.navigate("Home")
    }

    const onAmountChange = (text: string) => {
        setAmount(text)
        setAmountNumber(+text)
    }

    const onConfirmPress = async () => {
        setIsBusy(true)
        setLastError("")

        tick(async () => {
            if (uiStore.lnUrlWithdrawParams) {
                try {
                    const response = await invoiceStore.withdrawLnurl(uiStore.lnUrlWithdrawParams, amountNumber)

                    if (response.status.toLowerCase() === "ok") {
                        await startConfetti()
                        onClose()
                    } else if (response.reason) {
                        setLastError(response.reason)
                    }
                } catch (error) {
                    setLastError(errorToString(error))
                    log.debug(`SAT010 onConfirmPress: Error getting withdraw request: ${error}`, true)
                }
            }

            setIsBusy(false)
        })
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => <HeaderBackButton tintColor={navigationOptions.headerTintColor} onPress={onClose} />,
            title: I18n.t("LnUrlWithdraw_HeaderTitle")
        })
    }, [navigation])

    useEffect(() => {
        const withdrawParams = route.params.withdrawParams
        const minSats = toSatoshi(withdrawParams.minWithdrawable).toNumber()
        let maxSats = toSatoshi(withdrawParams.maxWithdrawable).toNumber()

        if (maxSats > channelStore.remoteBalance) {
            maxSats = channelStore.remoteBalance
        }

        setDescription(withdrawParams.defaultDescription)
        setMaxReceivable(maxSats)
        setMinReceivable(minSats)
        setAmountError(I18n.t("LnUrlWithdraw_AmountError", { minSats: formatSatoshis(minSats), maxSats: formatSatoshis(maxSats) }))
    }, [route.params.withdrawParams])

    useEffect(() => {
        setOpeningFee(channelStore.calculateOpeningFee(amountNumber))
        setChannelRequestNeeded(amountNumber >= channelStore.remoteBalance)
        setIsInvalid(amountNumber < minReceivable || amountNumber > maxReceivable)
    }, [amountNumber])

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
                        <Input value={amount} keyboardType="number-pad" onChangeText={onAmountChange} />
                        {isInvalid && channelRequestNeeded && (
                            <ExpandableInfoItem title={I18n.t("ReceiveLightning_OpeningFeeText", { fee: openingFee })}>
                                <HStack alignItems="center">
                                    <Text color={secondaryTextColor} fontSize="xs">
                                        {I18n.t("ReceiveLightning_FeeInfoText", {
                                            name: channelStore.lspName,
                                            minimumFee: channelStore.lspFeeMinimum,
                                            percentFee: channelStore.lspFeePpmyraid / 100
                                        })}
                                    </Text>
                                </HStack>
                            </ExpandableInfoItem>
                        )}
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
