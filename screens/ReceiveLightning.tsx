import React, { useLayoutEffect, useState } from "react"
import { observer } from "mobx-react"
import { TextInput, View } from "react-native"
import { Button, useTheme, VStack, IconButton } from "native-base"
import { ReceiveLightningNavigationProp } from "screens/ReceiveStack"
import { addInvoice } from "services/LightningService"
import styles from "utils/styles"
import { QrCodeIcon } from "@bitcoin-design/bitcoin-icons-react-native/outline"
import useColor from "hooks/useColor"
import { toLong } from "utils/conversion"

type ReceiveLightningProps = {
    navigation: ReceiveLightningNavigationProp
}

const ReceiveLightning = ({ navigation }: ReceiveLightningProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const textColor = useColor(colors.warmGray[50], colors.dark[200])
    const [amount, setAmount] = useState("")

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: "Receive",
            headerRight: () => <IconButton variant="ghost" size="sm" icon={<QrCodeIcon />} _icon={{ color: "#ffffff", size: 32 }} />
        })
    }, [navigation])

    const onAmountMsatChange = (text: string) => {
        setAmount(text)
    }

    const onCreatePress = async () => {
        const invoice = await addInvoice(+amount)
        navigation.navigate("ReceiveQr", { qrCode: invoice.paymentRequest })
    }

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            <VStack space={2}>
                <TextInput
                    value={amount}
                    keyboardType="number-pad"
                    onChangeText={onAmountMsatChange}
                    placeholder="Sats"
                    style={{
                        color: textColor,
                        borderWidth: 1,
                        borderColor: textColor,
                        borderRadius: 10,
                        paddingHorizontal: 10
                    }}
                />
                <Button onPress={onCreatePress} disabled={amount.length == 0}>
                    Create
                </Button>
            </VStack>
        </View>
    )
}

export default observer(ReceiveLightning)
