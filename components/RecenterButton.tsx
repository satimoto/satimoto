import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons"
import { IconButton, useTheme } from "native-base"
import React from "react"
import { GestureResponderEvent, StyleProp, StyleSheet, ViewStyle } from "react-native"
import useColor from "hooks/useColor"


interface RecenterButtonProps {
    onPress: (event: GestureResponderEvent) => void
    color?: string
    size?: number
    style?: StyleProp<ViewStyle>
}

const RecenterButton = ({ onPress, color, size = 20, style = {} }: RecenterButtonProps) => {
    const { colors } = useTheme()
    let textColor = useColor(colors.darkText, colors.lightText)

    if (color) {
        textColor = color
    }
    
    return (
        <IconButton
            borderRadius="full"
            size="lg"
            padding={3}
            backgroundColor={colors.white}
            variant="solid"
            onPress={onPress}
            icon={<FontAwesomeIcon icon={faLocationCrosshairs} />}
            _icon={{ color: textColor, size }}
        />
    )
}

export default RecenterButton
