import { QrCodeIcon } from "@bitcoin-design/bitcoin-icons-react-native/outline"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import Input from "components/Input"
import useColor from "hooks/useColor"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { Button, FormControl, IconButton, useColorModeValue, useTheme, VStack } from "native-base"
import React, { useEffect, useLayoutEffect, useState } from "react"
import { View } from "react-native"
import { AppStackParamList } from "screens/AppStack"
import styles from "utils/styles"

type ReceiveLightningProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "ReceiveLightning">
}

const ReceiveLightning = ({ navigation }: ReceiveLightningProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const textColor = useColorModeValue("lightText", "darkText")
    const [amount, setAmount] = useState("")
    const [channelRequestNeeded, setChannelRequestNeeded] = useState(false)
    const { channelStore, invoiceStore } = useStore()

    useLayoutEffect(() => {
        navigation.setOptions({
            title: "Receive",
            headerRight: () => (
                <IconButton
                    colorScheme="muted"
                    variant="ghost"
                    p={0.5}
                    onPress={() => navigation.navigate("SendCamera")}
                    icon={<QrCodeIcon />}
                    _icon={{ color: "#ffffff", size: 32 }}
                />
            )
        })
    }, [navigation])

    useEffect(() => {
        setChannelRequestNeeded(+amount >= channelStore.remoteBalance)
    }, [amount])

    const onAmountChange = (text: string) => {
        setAmount(text)
    }

    const onConfirmPress = async () => {
        const invoice = await invoiceStore.addInvoice(+amount)
        navigation.navigate("ReceiveQr", { qrCode: invoice.paymentRequest })
    }

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            <VStack space={5}>
                <FormControl isRequired={true}>
                    <FormControl.Label _text={{ color: textColor }}>Amount</FormControl.Label>
                    <Input value={amount} keyboardType="number-pad" onChangeText={onAmountChange} />
                    {channelRequestNeeded && <FormControl.HelperText>A new channel is needed</FormControl.HelperText>}
                </FormControl>
                <Button onPress={onConfirmPress} isDisabled={amount.length == 0}>
                    Next
                </Button>
            </VStack>
        </View>
    )
}

export default observer(ReceiveLightning)
