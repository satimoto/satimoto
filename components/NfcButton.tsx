import { IconButton, useTheme } from "native-base"
import NfcIcon from "components/NfcIcon"
import React from "react"
import { GestureResponderEvent, StyleProp, StyleSheet, ViewStyle } from "react-native"
import useColor from "hooks/useColor"

const styleSheet = StyleSheet.create({
    button: {
        margin: 10
    }
})

interface NfcButtonProps {
    isActive: boolean
    onPress: (event: GestureResponderEvent) => void
    color?: string
    size?: number
    style?: StyleProp<ViewStyle>
}

const NfcButton = ({ isActive, onPress, color, size = 50, style = {} }: NfcButtonProps) => {
    const { colors } = useTheme()
    let textColor = useColor(colors.darkText, colors.lightText)

    if (color) {
        textColor = color
    }

    return (
        <IconButton
            borderRadius="full"
            size="lg"
            backgroundColor={isActive ? colors.primary["500"] : "transparent"}
            variant="outline"
            style={[styleSheet.button, style]}
            onPress={onPress}
            icon={<NfcIcon size={30} />}
            _icon={{ color: isActive ? "#ffffff" : textColor, size }}
        />
    )
}

export default NfcButton
