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
import { getPayRequest } from "services/LnUrlService"
import { assertNetwork } from "utils/assert"
import { errorToString, toHashOrNull, toMilliSatoshi, toNumber, toSatoshi, toStringOrNull } from "utils/conversion"
import { formatSatoshis } from "utils/format"
import { Log } from "utils/logging"
import styles from "utils/styles"

const log = new Log("SendPayRequest")

type SendPayRequestProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "SendPayRequest">
}

const SendPayRequest = ({ navigation }: SendPayRequestProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const errorColor = useColorModeValue("error.300", "error.500")
    const textColor = useColorModeValue("lightText", "darkText")
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const { channelStore, paymentStore, uiStore } = useStore()

    const [amountString, setAmountString] = useState("")
    const [amountNumber, setAmountNumber] = useState(0)
    const [isBusy, setIsBusy] = useState(false)
    const [isInvalid, setIsInvalid] = useState(false)
    const [lastError, setLastError] = useState("")
    const [maxSendable, setMaxSendable] = useState(0)
    const [minSendable, setMinSendable] = useState(0)
    const [metadataHash, setMetadataHash] = useState<string | null>(null)
    const [amountError, setAmountError] = useState("")

    useEffect(() => {
        if (uiStore.lnUrlPayParams) {
            let maxSats = toSatoshi(uiStore.lnUrlPayParams.maxSendable).toNumber()
            let minSats = toSatoshi(uiStore.lnUrlPayParams.minSendable).toNumber()

            if (maxSats > channelStore.localBalance) {
                maxSats = channelStore.localBalance
            }

            setMaxSendable(maxSats)
            setMinSendable(minSats)
            setAmountError(`Must be between ${formatSatoshis(minSats)} and ${formatSatoshis(maxSats)} sats`)
        }
    }, [uiStore.lnUrlPayParams])

    useEffect(() => {
        if (uiStore.lnUrlPayParams) {
            setMetadataHash(toStringOrNull(toHashOrNull(uiStore.lnUrlPayParams.metadata)))
        }
    }, [uiStore.lnUrlPayParams])

    useEffect(() => {
        setIsInvalid(amountNumber < minSendable || amountNumber > maxSendable)
    }, [amountNumber])

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <HeaderBackButton
                    tintColor={navigationOptions.headerTintColor}
                    onPress={() => {
                        navigation.navigate("Home")
                    }}
                />
            ),
            title: "Send"
        })
    }, [navigation])

    const onAmountChange = (text: string) => {
        setAmountString(text)
        setAmountNumber(+text)
    }

    const onConfirmPress = async () => {
        setIsBusy(true)
        setLastError("")

        if (uiStore.lnUrlPayParams && uiStore.lnUrlPayParams.callback) {
            try {
                const payRequest = await getPayRequest(uiStore.lnUrlPayParams.callback, toMilliSatoshi(amountString).toString())
                assertNetwork(payRequest.pr)

                const decodedPayReq = await decodePayReq(payRequest.pr)
                log.debug(`Metadata hash: ${metadataHash}`)
                log.debug(`Payment Request hash: ${decodedPayReq.descriptionHash}`)
                
                if (decodedPayReq.descriptionHash === metadataHash && toNumber(decodedPayReq.numSatoshis) === amountNumber) {
                    // Pay
                    await paymentStore.sendPayment({paymentRequest: payRequest.pr})
                } else {
                    setLastError("Payment request invalid")
                }
            } catch (error) {
                setLastError(errorToString(error))
                log.debug(`Error getting pay request: ${error}`)
            }
        }

        setIsBusy(false)
    }

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            <VStack space={5}>
                <FormControl isInvalid={isInvalid} isRequired={true}>
                    <FormControl.Label _text={{color: textColor}}>Amount</FormControl.Label>
                    <Input value={amountString} keyboardType="number-pad" onChangeText={onAmountChange} />
                    {!isInvalid && <FormControl.HelperText>{amountError}</FormControl.HelperText>}
                    <FormControl.ErrorMessage _text={{color: errorColor}} leftIcon={<WarningOutlineIcon size="xs" />}>
                        {amountError}
                    </FormControl.ErrorMessage>
                </FormControl>
                {lastError.length > 0 && <Text color={errorColor}>{lastError}</Text>}
                <BusyButton isBusy={isBusy} onPress={onConfirmPress} isDisabled={isInvalid}>
                    Next
                </BusyButton>
            </VStack>
        </View>
    )
}

export default observer(SendPayRequest)
