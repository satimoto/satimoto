import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import React from "react"
import { GestureResponderEvent, StyleSheet, View } from "react-native"
import QRCode from "react-native-qrcode-svg"

const styleSheet = StyleSheet.create({
    qrCode: {
        justifyContent: "center",
        alignItems: "center"
    }
})

interface QrCodeProps {
    value: string
    onPress?: (event: GestureResponderEvent) => void
    size?: number
}

const QrCode = ({ value, onPress, size = 300 }: QrCodeProps) => {
    return (
        <TouchableOpacityOptional onPress={onPress}>
            <View style={styleSheet.qrCode}>
                <QRCode value={value} size={size} />
            </View>
        </TouchableOpacityOptional>
    )
}

export default QrCode