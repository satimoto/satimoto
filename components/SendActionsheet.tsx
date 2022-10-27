import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faAt, faBolt, faWifi } from "@fortawesome/free-solid-svg-icons"
import I18n from "i18n-js"
import { Actionsheet } from "native-base"
import React from "react"
import { StyleSheet } from "react-native"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"

const styleSheet = StyleSheet.create({
    item: {
        borderBottomWidth: 1,
        borderBottomColor: "#eee"
    }
})

interface SendActionsheetProps {
    isOpen: boolean
    onPress: (event: string) => void
    onClose: () => void
}

const SendActionsheet = ({ isOpen, onPress, onClose }: SendActionsheetProps) => {
    const { uiStore } = useStore()

    const onActionsheetPress = (event: string) => {
        onPress(event)
        onClose()
    }

    return (
        <Actionsheet isOpen={isOpen} onClose={onClose} hideDragIndicator>
            <Actionsheet.Content>
                <Actionsheet.Item
                    onPress={() => onActionsheetPress("send_address")}
                    startIcon={<FontAwesomeIcon icon={faAt} />}
                    style={styleSheet.item}
                >
                    {I18n.t("SendActionsheet_SendAddress")}
                </Actionsheet.Item>
                <Actionsheet.Item
                    onPress={() => onActionsheetPress("send_lightning")}
                    startIcon={<FontAwesomeIcon icon={faBolt} />}
                    style={uiStore.nfcAvailable ? styleSheet.item: {}}
                >
                    {I18n.t("SendActionsheet_SendLightning")}
                </Actionsheet.Item>
                {uiStore.nfcAvailable && (
                    <Actionsheet.Item onPress={() => onActionsheetPress("send_nfc")} startIcon={<FontAwesomeIcon icon={faWifi} />}>
                        {I18n.t("SendActionsheet_SendNfc")}
                    </Actionsheet.Item>
                )}
            </Actionsheet.Content>
        </Actionsheet>
    )
}

export default observer(SendActionsheet)
