import Modal from "components/Modal"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faWifi } from "@fortawesome/free-solid-svg-icons"
import { Text, useColorModeValue, useTheme, VStack } from "native-base"
import React, { useEffect } from "react"
import NfcManager, { NfcEvents, TagEvent } from "react-native-nfc-manager"
import I18n from "utils/i18n"
import useColor from "hooks/useColor"

interface ScanNfcModalProps {
    isVisible: boolean
    onNfcTag: (nfcTagEvent: TagEvent) => void
    onClose: () => void
}

const ScanNfcModal = ({ isVisible, onNfcTag, onClose }: ScanNfcModalProps) => {
    const { colors } = useTheme()
    const textColor = useColorModeValue("lightText", "darkText")
    const iconColor = useColor(colors.lightText, colors.darkText)

    const startReceiver = async () => {
        stopReceiver()

        try {
            await NfcManager.start()

            NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
                onNfcTag(tag)
                onClose()

                NfcManager.unregisterTagEvent().catch(() => {})
            })

            NfcManager.setEventListener(NfcEvents.SessionClosed, () => {
                onClose()
            })

            NfcManager.registerTagEvent();
        } catch {
            onClose()
        }
    }

    const stopReceiver = () => {
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null)
        NfcManager.setEventListener(NfcEvents.SessionClosed, null)
    }

    useEffect(() => {
        if (isVisible) {
            startReceiver()
        } else {
            stopReceiver()
        }
    }, [isVisible])

    useEffect(() => {
        return () => {
            stopReceiver()
        }
    }, [])

    return (
        <Modal isVisible={isVisible} onClose={onClose}>
            <VStack alignItems="center">
                <Text color={textColor} fontSize="xl">
                    {I18n.t("ScanNfcModal_Title")}
                </Text>
                <FontAwesomeIcon color={iconColor} size={48} icon={faWifi} />
            </VStack>
        </Modal>
    )
}

export default ScanNfcModal
