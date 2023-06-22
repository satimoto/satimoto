import Input from "components/Input"
import BusyButton from "components/BusyButton"
import Modal from "components/Modal"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { Text, useColorModeValue, VStack } from "native-base"
import React, { useEffect, useState } from "react"
import { LN_BECH32_PREFIX } from "utils/constants"
import { errorToString } from "utils/conversion"
import I18n from "utils/i18n"

interface SendLightningModalProps {
    isVisible: boolean
    onClose: () => void
}

const SendLightningModal = ({ isVisible, onClose }: SendLightningModalProps) => {
    const textColor = useColorModeValue("lightText", "darkText")
    const { uiStore } = useStore()
    const [paymentRequest, setPaymentRequest] = useState("")
    const [isBusy, setIsBusy] = useState(false)
    const [lastError, setLastError] = useState("")

    const onConfirmPress = async () => {
        setIsBusy(true)
        setLastError("")

        try {
            await uiStore.setPaymentRequest(paymentRequest)
            onClose()
        } catch (error) {
            setLastError(errorToString(error))
        }

        setIsBusy(false)
    }

    const onModalClose = () => {
        if (!isBusy) {
            onClose()
        }
    }

    const onPaymentRequestChange = (text: string) => {
        setPaymentRequest(text)
    }

    useEffect(() => {
        if (!isVisible) {
            setPaymentRequest("")
            setIsBusy(false)
        }
    }, [isVisible])

    return (
        <Modal isVisible={isVisible} onClose={onModalClose}>
            <VStack alignItems="center" space={5} width="100%">
                <Text color={textColor} fontSize="xl">
                    {I18n.t("SendLightningModal_Title")}
                </Text>
                <Input
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect={false}
                    value={paymentRequest}
                    isFullWidth={true}
                    onChangeText={onPaymentRequestChange}
                    placeholder={LN_BECH32_PREFIX + "..."}
                />
                {lastError.length > 0 && <Text color="error.300">{lastError}</Text>}
                <BusyButton isBusy={isBusy} onPress={onConfirmPress}>
                    {I18n.t("Button_Next")}
                </BusyButton>
            </VStack>
        </Modal>
    )
}

export default observer(SendLightningModal)
