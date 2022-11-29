import { Buffer } from "buffer"
import Modal from "components/Modal"
import NfcReceiver from "components/NfcReceiver"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faWifi } from "@fortawesome/free-solid-svg-icons"
import useColor from "hooks/useColor"
import { Text, useColorModeValue, useTheme, VStack } from "native-base"
import React, { useEffect, useState } from "react"
import { TagEvent } from "react-native-nfc-manager"
import I18n from "utils/i18n"
import { IS_ANDROID } from "utils/constants"
import { Log } from "utils/logging"

const log = new Log("ScanNfcModal")

interface ScanNfcModalProps {
    isVisible: boolean
    schemes?: RegExp[]
    onNfcTag: (tag: TagEvent, payload?: string) => void
    onClose: () => void
}

const ScanNfcModal = ({ isVisible, schemes = [], onNfcTag, onClose }: ScanNfcModalProps) => {
    const { colors } = useTheme()
    const errorColor = useColorModeValue("error.300", "error.500")
    const textColor = useColorModeValue("lightText", "darkText")
    const iconColor = useColor(colors.lightText, colors.darkText)
    const [lastError, setLastError] = useState("")

    const onTag = (tag: TagEvent) => {
        setLastError("")

        if (schemes.length == 0) {
            onNfcTag(tag)
            return
        }

        if (tag.ndefMessage && tag.ndefMessage.length && tag.ndefMessage[0].payload) {    
            const tagBytes = new Uint8Array(tag.ndefMessage[0].payload)
            const tagStr = Buffer.from(tagBytes).toString("utf8", 1)

            for (const scheme of schemes) {
                if (scheme.test(tagStr)) {
                    onNfcTag(tag, tagStr)
                    return
                }
            }
        }

        setLastError(I18n.t("ScanNfcModal_SchemeError"))
        setTimeout(() => onClose(), 2500)
    }

    useEffect(() => {
        if (!isVisible) {
            setLastError("")
        }
    })

    return (
        <NfcReceiver isActive={isVisible} onTag={onTag} onClose={onClose}>
            {IS_ANDROID && (
                <Modal isVisible={isVisible} onClose={onClose}>
                    <VStack alignItems="center">
                        <Text color={textColor} fontSize="xl">
                            {I18n.t("ScanNfcModal_Title")}
                        </Text>
                        <FontAwesomeIcon color={iconColor} size={48} icon={faWifi} />
                        {lastError.length > 0 && <Text color={errorColor}>{lastError}</Text>}
                    </VStack>
                </Modal>
            )}
        </NfcReceiver>
    )
}

export default ScanNfcModal
