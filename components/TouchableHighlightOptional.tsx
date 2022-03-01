import React, { PropsWithChildren } from "react"
import { GestureResponderEvent, TouchableHighlight } from "react-native"

interface TouchableHighlightOptionalProps extends PropsWithChildren<any> {
    activeOpacity?: number
    onPress?: (event: GestureResponderEvent) => void
}

const TouchableHighlightOptional = ({ activeOpacity = 1, onPress, children }: TouchableHighlightOptionalProps) => {
    if (onPress) {
        return (
            <TouchableHighlight activeOpacity={activeOpacity} onPress={onPress}>
                {children}
            </TouchableHighlight>
        )
    }

    return <>{children}</>
}

export default TouchableHighlightOptional
