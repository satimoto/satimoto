import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import React from "react"
import { GestureResponderEvent, View } from "react-native"
import QRCode from "react-native-qrcode-svg"
import styles from "utils/styles"

interface QrCodeProps {
    value: string
    onPress?: (event: GestureResponderEvent) => void
    size?: number
}

const QrCode = ({ value, onPress, size = 300 }: QrCodeProps) => {
    return (
        <TouchableOpacityOptional onPress={onPress}>
            <View style={styles.center}>
                <QRCode value={value} size={size} />
            </View>
        </TouchableOpacityOptional>
    )
}

export default QrCode