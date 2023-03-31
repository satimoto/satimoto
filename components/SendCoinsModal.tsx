import Input from "components/Input"
import BusyButton from "components/BusyButton"
import Modal from "components/Modal"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faCircle } from "@fortawesome/free-solid-svg-icons"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { FormControl, HStack, Text, useColorModeValue, VStack } from "native-base"
import React, { useEffect, useState } from "react"
import { assertAddress } from "utils/assert"
import I18n from "utils/i18n"
import { errorToString } from "utils/conversion"
import styles from "utils/styles"

interface SendCoinsModalProps {
    isVisible: boolean
    onClose: () => void
}

const SendCoinsModal = ({ isVisible, onClose }: SendCoinsModalProps) => {
    const errorColor = useColorModeValue("error.300", "error.500")
    const primaryTextColor = useColorModeValue("lightText", "darkText")
    const secondaryTextColor = useColorModeValue("warmGray.200", "dark.200")
    const [isBusy, setIsBusy] = useState(false)
    const [isAddressInvalid, setIsAddressInvalid] = useState(false)
    const [address, setAddress] = useState("")
    const [lastError, setLastError] = useState("")
    const { walletStore } = useStore()

    const onInputChange = (text: string) => {
        setAddress(text)
    }

    const onConfirmPress = async () => {
        setIsBusy(true)

        try {
            await walletStore.sweep(address)

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
        try {
            assertAddress(address)
            setLastError("")
            setIsAddressInvalid(false)
        } catch (error) {
            setLastError(errorToString(error))
            setIsAddressInvalid(true)
        }
    }, [address])

    useEffect(() => {
        if (!isVisible) {
            setAddress("")
            setLastError("")
            setIsBusy(false)
        }
    }, [isVisible])

    return (
        <Modal isVisible={isVisible} onClose={onModalClose}>
            <VStack alignItems="flex-start" space={5} width="100%">
                <Text color={primaryTextColor} fontSize="xl">
                    {I18n.t("OnChain_Text")}
                </Text>
                <HStack>
                    <FontAwesomeIcon icon={faCircle} color="#ffffff" size={10} style={styles.bulletPadding} />
                    <Text color={secondaryTextColor} fontSize="lg" marginRight={16}>
                        {I18n.t("OnChain_ControlText")}
                    </Text>
                </HStack>
                <HStack>
                    <FontAwesomeIcon icon={faCircle} color="#ffffff" size={10} style={styles.bulletPadding} />
                    <Text color={secondaryTextColor} fontSize="lg" marginRight={16}>
                        {I18n.t("OnChain_ConfirmText")}
                    </Text>
                </HStack>
            </VStack>
            <VStack alignItems="center" space={5} width="100%" marginTop={5}>
                <FormControl isRequired={true}>
                    <Input value={address} keyboardType="default" isFullWidth={true} onChangeText={onInputChange} />
                </FormControl>
                {lastError.length > 0 && <Text color={errorColor}>{lastError}</Text>}
                <BusyButton isBusy={isBusy} onPress={onConfirmPress} isDisabled={isAddressInvalid}>
                    {I18n.t("Button_Close")}
                </BusyButton>
            </VStack>
        </Modal>
    )
}

export default observer(SendCoinsModal)
