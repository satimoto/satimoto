import BusyButton from "components/BusyButton"
import Modal from "components/Modal"
import { observer } from "mobx-react"
import { Text, useColorModeValue, VStack } from "native-base"
import React, { useState } from "react"

interface ConfirmationModalProps {
    isVisible: boolean
    text: string
    buttonText: string
    onClose: () => void
    onPress: () => Promise<void>
}

const ConfirmationModal = ({ isVisible, text, buttonText, onClose, onPress }: ConfirmationModalProps) => {
    const textColor = useColorModeValue("lightText", "darkText")
    const [isBusy, setIsBusy] = useState(false)

    const onConfirmPress = async () => {
        setIsBusy(true)

        try {
            await onPress()
        } catch {}

        setIsBusy(false)
    }

    return (
        <Modal isVisible={isVisible} onClose={onClose}>
            <VStack alignItems="center" space={5} width="100%">
                <Text color={textColor} fontSize="xl">
                    {text}
                </Text>
                <BusyButton isBusy={isBusy} onPress={onConfirmPress}>
                    {buttonText}
                </BusyButton>
            </VStack>
        </Modal>
    )
}

export default observer(ConfirmationModal)
