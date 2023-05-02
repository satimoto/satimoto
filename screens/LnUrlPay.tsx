import BusyButton from "components/BusyButton"
import HeaderBackButton from "components/HeaderBackButton"
import Input from "components/Input"
import RoundedButton from "components/RoundedButton"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { FormControl, Text, useColorModeValue, useTheme, VStack, WarningOutlineIcon } from "native-base"
import { useConfetti } from "providers/ConfettiProvider"
import React, { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { Linking, View } from "react-native"
import {
    AesSuccessActionDataDecrypted,
    LnUrlErrorData,
    LnUrlPayResultType,
    MessageSuccessActionData,
    SuccessActionDataType,
    UrlSuccessActionData
} from "@breeztech/react-native-breez-sdk"
import { RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { getMetadataElement } from "services/lnUrl"
import { tick } from "utils/backoff"
import { toSatoshi } from "utils/conversion"
import { formatSatoshis } from "utils/format"
import I18n from "utils/i18n"
import { Log } from "utils/logging"
import styles from "utils/styles"

const log = new Log("LnUrlPay")

type LnUrlPayProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "LnUrlPay">
    route: RouteProp<AppStackParamList, "LnUrlPay">
}

const LnUrlPay = ({ navigation, route }: LnUrlPayProps) => {
    const { startConfetti } = useConfetti()
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const focusBackgroundColor = useColor(colors.dark[400], colors.warmGray[200])
    const errorColor = useColorModeValue("error.300", "error.500")
    const textColor = useColorModeValue("lightText", "darkText")
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const [amountError, setAmountError] = useState("")
    const [amountString, setAmountString] = useState("")
    const [amountNumber, setAmountNumber] = useState(0)
    const [comment, setComment] = useState("")
    const [commentAllowed, setCommentAllowed] = useState(0)
    const [commentError, setCommentError] = useState("")
    const [description, setDescription] = useState("")
    const [decryptedAes, setDecryptedAes] = useState("")
    const [isBusy, setIsBusy] = useState(false)
    const [isCommentInvalid, setIsCommentInvalid] = useState(false)
    const [isDirty, setIsDirty] = useState(false)
    const [isInvalid, setIsInvalid] = useState(true)
    const [isSuccessful, setIsSuccessful] = useState(false)
    const [lastError, setLastError] = useState("")
    const [maxSendable, setMaxSendable] = useState(0)
    const [minSendable, setMinSendable] = useState(0)
    const [url, setUrl] = useState("")
    const { channelStore, paymentStore, uiStore } = useStore()

    const onClose = () => {
        uiStore.clearLnUrl()
        navigation.navigate("Home")
    }

    const onAmountChange = (text: string) => {
        setAmountString(text)
        setAmountNumber(+text)
        setIsDirty(true)
    }

    const onConfirmPress = useCallback(async () => {
        setIsBusy(true)
        setLastError("")

        tick(async () => {
            if (route.params.payParams) {
                try {
                    const response = await paymentStore.payLnurl(route.params.payParams, amountNumber)

                    if (response.type === LnUrlPayResultType.ENDPOINT_SUCCESS) {
                        if (response.data) {
                            let actionData = response.data as UrlSuccessActionData
                            setIsSuccessful(true)

                            if (actionData.type === SuccessActionDataType.AES) {
                                const lnSuccessActionData = response.data as AesSuccessActionDataDecrypted
                                setDescription(lnSuccessActionData.description)
                                setDecryptedAes(lnSuccessActionData.plaintext)
                            } else if (actionData.type === SuccessActionDataType.MESSAGE) {
                                const lnSuccessActionData = response.data as MessageSuccessActionData
                                setDescription(lnSuccessActionData.message)
                            } else {
                                const lnSuccessActionData = actionData
                                setDescription(lnSuccessActionData.description)
                                setUrl(lnSuccessActionData.url)
                            }

                            await startConfetti()
                        } else {
                            await startConfetti()
                            onClose()
                        }
                    } else {
                        const lnUrlErrorData = response.data as LnUrlErrorData

                        setLastError(lnUrlErrorData?.reason || I18n.t("LnUrlPay_PayReqError"))
                    }
                } catch (error) {
                    setLastError(I18n.t("PaymentFailure_NoRoute"))
                    log.debug(`SAT009 onConfirmPress: Error getting pay request: ${error}`, true)
                }
            }

            setIsBusy(false)
        })
    }, [route.params.payParams, amountNumber])

    const onUrlPress = useCallback(async () => {
        if (url) {
            Linking.openURL(url)
        }
    }, [url])

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => <HeaderBackButton tintColor={navigationOptions.headerTintColor} onPress={onClose} />,
            title: I18n.t("LnUrlPay_HeaderTitle")
        })
    }, [navigation])

    useEffect(() => {
        const payParams = route.params.payParams
        const decodedMetadata = JSON.parse(payParams.metadataStr)
        const minSats = toSatoshi(payParams.minSendable).toNumber()
        let maxSats = toSatoshi(payParams.maxSendable).toNumber()

        if (maxSats > channelStore.availableBalance) {
            maxSats = channelStore.availableBalance
        }

        setCommentAllowed(payParams.commentAllowed)
        setDescription(getMetadataElement(decodedMetadata, "text/plain") || "")
        setMaxSendable(maxSats)
        setMinSendable(minSats)
        setAmountError(I18n.t("LnUrlPay_AmountError", { minSats: formatSatoshis(minSats), maxSats: formatSatoshis(maxSats) }))
        setCommentError(I18n.t("LnUrlPay_CommentError", { maxChars: payParams.commentAllowed }))
    }, [route.params.payParams])

    useEffect(() => {
        setIsInvalid(isDirty && (amountNumber < minSendable || amountNumber > maxSendable))
    }, [amountNumber, isDirty, minSendable, maxSendable])

    useEffect(() => {
        setIsCommentInvalid(comment.length > commentAllowed)
    }, [comment, commentAllowed])

    return (
        <View style={[styles.matchParent, { backgroundColor: focusBackgroundColor }]}>
            <View style={[styles.focusViewPanel, { backgroundColor }]}>
                {isSuccessful ? (
                    <VStack space={5}>
                        {description.length > 0 && (
                            <Text color={textColor} fontSize="lg">
                                {description}
                            </Text>
                        )}
                        {decryptedAes.length > 0 && (
                            <View style={{ backgroundColor, alignItems: "center" }}>
                                <Text color={textColor} fontSize="xl" fontWeight="bold">
                                    {decryptedAes}
                                </Text>
                            </View>
                        )}
                        {url.length > 0 && (
                            <RoundedButton size="md" onPress={onUrlPress}>
                                {I18n.t("Button_Website")}
                            </RoundedButton>
                        )}
                    </VStack>
                ) : (
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
                        {commentAllowed > 0 && (
                            <FormControl isInvalid={isCommentInvalid}>
                                <FormControl.Label _text={{ color: textColor }}>Comment</FormControl.Label>
                                <Input value={comment} onChangeText={setComment} />
                                <FormControl.ErrorMessage _text={{ color: errorColor }} leftIcon={<WarningOutlineIcon size="xs" />}>
                                    {commentError}
                                </FormControl.ErrorMessage>
                            </FormControl>
                        )}
                        {lastError.length > 0 && <Text color={errorColor}>{lastError}</Text>}
                        <BusyButton isBusy={isBusy} onPress={onConfirmPress} isDisabled={isInvalid || isCommentInvalid || !isDirty}>
                            {I18n.t("Button_Next")}
                        </BusyButton>
                    </VStack>
                )}
            </View>
        </View>
    )
}

export default observer(LnUrlPay)
