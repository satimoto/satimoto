import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import React from "react"
import { GestureResponderEvent, StyleProp, View, ViewStyle } from "react-native"
import { QRCode } from "react-native-custom-qr-codes"
import styles from "utils/styles"

interface QrCodeProps {
    value: string
    color?: string
    backgroundColor?: string
    onPress?: (event: GestureResponderEvent) => void
    size?: number
    style?: StyleProp<ViewStyle>
}

const QrCode = ({ value, color = "black", backgroundColor = "white", onPress, size = 300, style }: QrCodeProps) => {
    return (
        <TouchableOpacityOptional onPress={onPress} style={style}>
            <View style={styles.center}>
                <QRCode content={value} color={color} backgroundColor={backgroundColor} size={size} codeStyle="circle" ecl="M" />
            </View>
        </TouchableOpacityOptional>
    )
}

export default QrCode