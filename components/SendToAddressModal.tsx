import Input from "components/Input"
import BusyButton from "components/BusyButton"
import Modal from "components/Modal"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { Text, useColorModeValue, VStack } from "native-base"
import React, { useEffect, useState } from "react"
import { assertEmail } from "utils/assert"
import { tick } from "utils/backoff"
import { errorToString } from "utils/conversion"
import I18n from "utils/i18n"

interface SendToAddressModalProps {
    isVisible: boolean
    onClose: () => void
}

const SendToAddressModal = ({ isVisible, onClose }: SendToAddressModalProps) => {
    const textColor = useColorModeValue("lightText", "darkText")
    const { uiStore } = useStore()

    const [address, setAddress] = useState("")
    const [isAddressInvalid, setIsAddressInvalid] = useState(true)
    const [isBusy, setIsBusy] = useState(false)
    const [lastError, setLastError] = useState("")

    const onAddressChange = (text: string) => {
        setAddress(text)
    }

    const onConfirmPress = async () => {
        setIsBusy(true)
        setLastError("")

        tick(async () => {
            try {
                await uiStore.parseIntent(address)
                onClose()
            } catch (error) {
                setLastError(errorToString(error))
            }
        })

        setIsBusy(false)
    }

    const onModalClose = () => {
        if (!isBusy) {
            onClose()
        }
    }

    useEffect(() => {
        try {
            assertEmail(address)
            setIsAddressInvalid(false)
        } catch {
            setIsAddressInvalid(true)
        }
    }, [address])

    useEffect(() => {
        if (!isVisible) {
            setAddress("")
            setIsBusy(false)
        }
    }, [isVisible])

    return (
        <Modal isVisible={isVisible} onClose={onModalClose}>
            <VStack alignItems="center" space={5} width="100%">
                <Text color={textColor} fontSize="xl">
                    {I18n.t("SendToAddressModal_Title")}
                </Text>
                <Input
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect={false}
                    value={address}
                    isFullWidth={true}
                    onChangeText={onAddressChange}
                    placeholder="hello@satimoto.com"
                />
                {lastError.length > 0 && <Text color="error.300">{lastError}</Text>}
                <BusyButton isBusy={isBusy} onPress={onConfirmPress} isDisabled={isAddressInvalid}>
                    {I18n.t("Button_Next")}
                </BusyButton>
            </VStack>
        </Modal>
    )
}

export default observer(SendToAddressModal)
