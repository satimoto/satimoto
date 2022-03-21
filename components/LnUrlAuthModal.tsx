import BusyButton from "components/BusyButton"
import Modal from "components/Modal"
import { LNURLAuthParams } from "js-lnurl"
import { Text, useColorModeValue, VStack } from "native-base"
import React, { useState } from "react"
import { authenticate } from "services/LnUrlService"
import { errorToString } from "utils/conversion"

interface LnUrlAuthModalProps {
    lnUrlAuthParams?: LNURLAuthParams
    onClose: () => void
}

const LnUrlAuthModal = ({ lnUrlAuthParams, onClose }: LnUrlAuthModalProps) => {
    const errorColor = useColorModeValue("error.300", "error.500")
    const textColor = useColorModeValue("lightText", "darkText")
    const [isBusy, setIsBusy] = useState(false)
    const [lastError, setLastError] = useState("")

    const onConfirmPress = async () => {
        setIsBusy(true)

        try {
            await authenticate(lnUrlAuthParams!)
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

    return lnUrlAuthParams ? (
        <Modal isVisible={true} onClose={onModalClose}>
            <VStack alignItems="center">
                <Text color={textColor} fontSize="xl">
                    Do you want to login to
                </Text>
                <Text color={textColor} fontSize="xl" fontWeight="bold">
                    {lnUrlAuthParams.domain}
                </Text>
                {lastError.length > 0 && <Text color={errorColor}>{lastError}</Text>}
                <BusyButton isBusy={isBusy} marginTop={5} onPress={onConfirmPress}>
                    Login
                </BusyButton>
            </VStack>
        </Modal>
    ) : (
        <></>
    )
}

export default LnUrlAuthModal
