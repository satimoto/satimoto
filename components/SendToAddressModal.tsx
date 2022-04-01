import { useNavigation } from "@react-navigation/native"
import Input from "components/Input"
import BusyButton from "components/BusyButton"
import Modal from "components/Modal"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { Text, useColorModeValue, VStack } from "native-base"
import React, { useEffect, useState } from "react"
import { HomeNavigationProp } from "screens/Home"
import { identifier } from "services/LnUrlService"
import { errorToString } from "utils/conversion"
import { assertEmail } from "utils/assert"

interface SendToAddressModalProps {
    isVisible: boolean
    onClose: () => void
}

const SendToAddressModal = ({ isVisible, onClose }: SendToAddressModalProps) => {
    const textColor = useColorModeValue("lightText", "darkText")
    const navigation = useNavigation<HomeNavigationProp>()
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

        try {
            const payParams = await identifier(address)
            uiStore.setLnUrlPayParams(payParams)
        } catch (error) {
            setIsBusy(false)
            setLastError(errorToString(error))
        }
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

    useEffect(() => {
        if (uiStore.lnUrlPayParams) {
            navigation.navigate("SendPayRequest")
            onClose()
        }
    }, [uiStore.lnUrlPayParams])

    return (
        <Modal isVisible={isVisible} onClose={onModalClose}>
            <VStack alignItems="center" space={5} width="100%">
                <Text color={textColor} fontSize="xl">
                    Send to lightning address
                </Text>
                <Input
                    autoCapitalize="none"
                    autoCompleteType="off"
                    autoCorrect={false}
                    value={address}
                    isFullWidth={true}
                    onChangeText={onAddressChange}
                    placeholder="hello@satimoto.com"
                />
                {lastError.length > 0 && <Text color="error.300">{lastError}</Text>}
                <BusyButton isBusy={isBusy} onPress={onConfirmPress} isDisabled={isAddressInvalid}>
                    Next
                </BusyButton>
            </VStack>
        </Modal>
    )
}

export default observer(SendToAddressModal)