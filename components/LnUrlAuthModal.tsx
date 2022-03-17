import BusySpinner from "components/BusySpinner"
import Modal from "components/Modal"
import { LNURLAuthParams } from "js-lnurl"
import { Button, Text, useColorModeValue, VStack } from "native-base"
import React, { useState } from "react"
import { authenticate } from "services/LnUrlService"

interface LnUrlAuthModalProps {
    lnUrlAuthParams?: LNURLAuthParams
    onClose: () => void
}

const LnUrlAuthModal = ({ lnUrlAuthParams, onClose }: LnUrlAuthModalProps) => {
    const textColor = useColorModeValue("lightText", "darkText")
    const [isBusy, setIsBusy] = useState(false)

    const onConfirmPress = async () => {
        setIsBusy(true)
        await authenticate(lnUrlAuthParams!)
        onClose()
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
                <BusySpinner isBusy={isBusy} marginTop={5} size="lg">
                    <Button marginTop={5} onPress={onConfirmPress}>
                        Login
                    </Button>
                </BusySpinner>
            </VStack>
        </Modal>
    ) : (
        <></>
    )
}

export default LnUrlAuthModal
