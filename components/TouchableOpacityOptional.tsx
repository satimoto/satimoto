import React, { PropsWithChildren } from "react"
import { GestureResponderEvent, StyleProp, TouchableOpacity, ViewStyle } from "react-native"

interface TouchableOpacityOptionalProps extends PropsWithChildren<any> {
    disabled?: boolean
    onPress?: (event: GestureResponderEvent) => void
    onPressIn?: (event: GestureResponderEvent) => void
    onPressOut?: (event: GestureResponderEvent) => void
    style?: StyleProp<ViewStyle>
}

const TouchableOpacityOptional = ({
    disabled = false,
    onPress,
    onPressIn = () => {},
    onPressOut = () => {},
    children,
    style = {}
}: TouchableOpacityOptionalProps) => {
    if (onPress) {
        return (
            <TouchableOpacity disabled={disabled} onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress} style={style}>
                {children}
            </TouchableOpacity>
        )
    }

    return <>{children}</>
}

export default TouchableOpacityOptional
