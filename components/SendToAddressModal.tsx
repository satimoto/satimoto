import { useNavigation } from "@react-navigation/native"
import BusySpinner from "components/BusySpinner"
import Modal from "components/Modal"
import useColor from "hooks/useColor"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { Button, Text, useTheme, VStack } from "native-base"
import React, { useEffect, useState } from "react"
import { TextInput } from "react-native"
import { SendNavigationProp } from "screens/AppStack"
import { identifier } from "services/LnUrlService"
import styles from "utils/styles"

interface SendToAddressModalProps {
    isVisible: boolean
    onClose: () => void
}

const SendToAddressModal = ({ isVisible, onClose }: SendToAddressModalProps) => {
    const {colors} = useTheme()
    const textColor = useColor(colors.lightText, colors.darkText)
    const navigation = useNavigation<SendNavigationProp>()
    const [address, setAddress] = useState("")
    const [isBusy, setIsBusy] = useState(false)
    const { uiStore } = useStore()

    const onAddressChange = (text: string) => {
        setAddress(text)
    }

    const onConfirmPress = async () => {
        setIsBusy(true)

        try {
            const payParams = await identifier(address)
            uiStore.setLnUrlPayParams(payParams)
            onClose()
        } catch {}

        setIsBusy(false)
    }

    const onModalClose = () => {
        if (!isBusy) {
            onClose()
        }
    }

    useEffect(() => {
        if (uiStore.lnUrlPayParams) {
            navigation.navigate("Home")

        }
    }, [uiStore.lnUrlAuthParams])

    return (
        <Modal isVisible={isVisible} onClose={onModalClose}>
            <VStack alignItems="center" width="100%">
                <Text color={textColor} fontSize="xl">
                    Send to lightning address
                </Text>
                <TextInput
                    value={address}
                    onChangeText={onAddressChange}
                    style={[
                        styles.textInput,
                        {
                            color: textColor,
                            borderColor: textColor,
                            width: "100%"
                        }
                    ]}
                />
                <BusySpinner isBusy={isBusy} marginTop={5} size="lg">
                    <Button marginTop={5} onPress={onConfirmPress} disabled={address.length == 0}>
                        Ok
                    </Button>
                </BusySpinner>
            </VStack>
        </Modal>
    )
}

export default observer(SendToAddressModal)
