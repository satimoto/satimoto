import BusyButton from "components/BusyButton"
import Modal from "components/Modal"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faCircle } from "@fortawesome/free-solid-svg-icons"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { HStack, Text, useColorModeValue, VStack } from "native-base"
import React, { useEffect, useState } from "react"
import { LightningBackend } from "types/lightningBackend"
import I18n from "utils/i18n"
import styles from "utils/styles"

interface SwapBackendModalProps {
    isVisible: boolean
    backend: LightningBackend
    onClose: () => void
}

const SwapBackendModal = ({ isVisible, backend, onClose }: SwapBackendModalProps) => {
    const primaryTextColor = useColorModeValue("lightText", "darkText")
    const secondaryTextColor = useColorModeValue("warmGray.200", "dark.200")
    const [isBusy, setIsBusy] = useState(false)
    const [isInvalid, setIsInvalid] = useState(false)
    const { channelStore, lightningStore, walletStore } = useStore()

    const onConfirmPress = async () => {
        setIsBusy(true)

        try {
            await lightningStore.switchBackend(backend)
            onClose()
        } catch (error) {}

        setIsBusy(false)
    }

    const onModalClose = () => {
        if (!isBusy) {
            onClose()
        }
    }

    useEffect(() => {
        if (!isVisible) {
            setIsBusy(false)
        }
    }, [isVisible])

    useEffect(() => {
        if (lightningStore.backend === LightningBackend.BREEZ_SDK) {
            setIsInvalid(false)
        } else if (lightningStore.backend === LightningBackend.LND) {
            setIsInvalid(channelStore.localBalance > 0 || channelStore.remoteBalance > 0 || walletStore.totalBalance > 0)
        }
    }, [lightningStore.backend])

    return (
        <Modal isVisible={isVisible} onClose={onModalClose}>
            {lightningStore.backend === LightningBackend.BREEZ_SDK && (
                <VStack alignItems="flex-start" space={5} width="100%">
                    <Text color={primaryTextColor} fontSize="xl">
                        {I18n.t("SwapBackendModal_BreezSdkText", { backend: I18n.t(backend) })}
                    </Text>
                </VStack>
            )}
            {lightningStore.backend === LightningBackend.LND && (
                <VStack alignItems="flex-start" space={5} width="100%">
                    <Text color={primaryTextColor} fontSize="xl">
                        {I18n.t("SwapBackendModal_LndText", { backend: I18n.t(backend) })}
                    </Text>
                    <HStack>
                        <FontAwesomeIcon icon={faCircle} color="#ffffff" size={10} style={styles.bulletPadding} />
                        <Text color={secondaryTextColor} fontSize="lg" marginRight={16}>
                            {I18n.t("SwapBackendModal_SendText")}
                        </Text>
                    </HStack>
                    <HStack>
                        <FontAwesomeIcon icon={faCircle} color="#ffffff" size={10} style={styles.bulletPadding} />
                        <Text color={secondaryTextColor} fontSize="lg" marginRight={16}>
                            {I18n.t("SwapBackendModal_CloseText")}
                        </Text>
                    </HStack>
                </VStack>
            )}
            <VStack alignItems="center" space={5} width="100%" marginTop={5}>
                <BusyButton isBusy={isBusy} onPress={onConfirmPress} isDisabled={isInvalid}>
                    {I18n.t("Button_Ok")}
                </BusyButton>
            </VStack>
        </Modal>
    )
}

export default observer(SwapBackendModal)
