import BusyButton from "components/BusyButton"
import Modal from "components/Modal"
import { LNURLAuthParams } from "js-lnurl"
import { Text, useColorModeValue, VStack } from "native-base"
import React, { useEffect, useState } from "react"
import { authenticate } from "services/LnUrlService"
import { errorToString } from "utils/conversion"
import I18n from "utils/i18n"

interface LnUrlAuthModalProps {
    lnUrlAuthParams?: LNURLAuthParams
    onClose: () => void
}

const LnUrlAuthModal = ({ lnUrlAuthParams, onClose }: LnUrlAuthModalProps) => {
    const errorColor = useColorModeValue("error.300", "error.500")
    const textColor = useColorModeValue("lightText", "darkText")
    const [isBusy, setIsBusy] = useState(false)
    const [domain, setDomain] = useState("")
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

    useEffect(() => {
        setDomain(lnUrlAuthParams ? lnUrlAuthParams.domain.replace("api.", "") : "")
    }, [lnUrlAuthParams?.domain])

    return lnUrlAuthParams ? (
        <Modal isVisible={true} onClose={onModalClose}>
            <VStack alignItems="center">
                <Text color={textColor} fontSize="xl">
                    {I18n.t("LnUrlAuthModal_Title")}
                </Text>
                <Text color={textColor} fontSize="xl" fontWeight="bold">
                    {domain}
                </Text>
                {lastError.length > 0 && <Text color={errorColor}>{lastError}</Text>}
                <BusyButton isBusy={isBusy} marginTop={5} onPress={onConfirmPress}>
                    {I18n.t("Button_Login")}
                </BusyButton>
            </VStack>
        </Modal>
    ) : (
        <></>
    )
}

export default LnUrlAuthModal
