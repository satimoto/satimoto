import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faWifi, faQrcode } from "@fortawesome/free-solid-svg-icons"
import I18n from "i18n-js"
import { Actionsheet, useColorModeValue } from "native-base"
import React from "react"
import { StyleSheet } from "react-native"

const styleSheet = StyleSheet.create({
    item: {
        borderBottomWidth: 1,
        borderBottomColor: "#eee"
    }
})

interface ReceiveActionsheetProps {
    isOpen: boolean
    onPress: (event: string) => void
    onClose: () => void
}

const ReceiveActionsheet = ({ isOpen, onPress, onClose }: ReceiveActionsheetProps) => {
    const onActionsheetPress = (event: string) => {
        onPress(event)
        onClose()
    }

    return (
        <Actionsheet isOpen={isOpen} onClose={onClose} hideDragIndicator>
            <Actionsheet.Content>
                <Actionsheet.Item onPress={() => onActionsheetPress("receive_qr")} startIcon={<FontAwesomeIcon icon={faQrcode} />} style={styleSheet.item}>
                    {I18n.t("ReceiveActionsheet_ReceiveQr")}
                </Actionsheet.Item>
                <Actionsheet.Item onPress={() => onActionsheetPress("receive_nfc")} startIcon={<FontAwesomeIcon icon={faWifi} />}>
                    {I18n.t("ReceiveActionsheet_ReceiveNfc")}
                </Actionsheet.Item>
            </Actionsheet.Content>
        </Actionsheet>
    )
}

export default ReceiveActionsheet
