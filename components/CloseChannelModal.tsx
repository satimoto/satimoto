import Input from "components/Input"
import BusyButton from "components/BusyButton"
import Modal from "components/Modal"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faCircle } from "@fortawesome/free-solid-svg-icons"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import ChannelModel from "models/Channel"
import { FormControl, HStack, Text, useColorModeValue, VStack } from "native-base"
import React, { useEffect, useState } from "react"
import { toChannelPoint } from "types/channel"
import { assertAddress } from "utils/assert"
import I18n from "utils/i18n"
import { errorToString } from "utils/conversion"
import styles from "utils/styles"

interface CloseChannelModalProps {
    isVisible: boolean
    channel: ChannelModel
    onClose: () => void
}

const CloseChannelModal = ({ isVisible, channel, onClose }: CloseChannelModalProps) => {
    const errorColor = useColorModeValue("error.300", "error.500")
    const primaryTextcolor = useColorModeValue("lightText", "darkText")
    const secondaryTextcolor = useColorModeValue("warmGray.200", "dark.200")
    const [isBusy, setIsBusy] = useState(false)
    const [isAddressInvalid, setIsAddressInvalid] = useState(false)
    const [address, setAddress] = useState("")
    const [lastError, setLastError] = useState("")
    const { channelStore } = useStore()

    const onInputChange = (text: string) => {
        setAddress(text)
    }

    const onConfirmPress = async () => {
        setIsBusy(true)

        try {
            const channelPoint = toChannelPoint(channel.channelPoint)

            if (channelPoint === null) {
                setLastError(I18n.t("CloseChannelModal_ChannelPointError"))
            } else {
                const channel = await channelStore.closeChannel({
                    channelPoint,
                    deliveryAddress: address
                })

                if (channel.closingTxid) {
                    onClose()
                } else {
                    setLastError(I18n.t("CloseChannelModal_CloseError"))
                }
            }
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
                <Text color={primaryTextcolor} fontSize="xl">
                    {I18n.t("CloseChannelModal_Text")}
                </Text>
                <HStack>
                    <FontAwesomeIcon icon={faCircle} color="#ffffff" size={10} style={styles.bulletPadding} />
                    <Text color={secondaryTextcolor} fontSize="lg" marginRight={16}>
                        {I18n.t("CloseChannelModal_ControlText")}
                    </Text>
                </HStack>
                <HStack>
                    <FontAwesomeIcon icon={faCircle} color="#ffffff" size={10} style={styles.bulletPadding} />
                    <Text color={secondaryTextcolor} fontSize="lg" marginRight={16}>
                        {I18n.t("CloseChannelModal_ConfirmText")}
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

export default observer(CloseChannelModal)
