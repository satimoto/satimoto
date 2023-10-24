
import React, { PropsWithChildren, useEffect, useState } from "react"
import { Animated, Dimensions, Keyboard, KeyboardEvent, TextInput, StyleSheet, UIManager, StyleProp, ViewStyle } from "react-native"

const styleSheet = StyleSheet.create({
    container: {
        top: 0,
        left: 0,
        position: "absolute",
        bottom: 0,
        right: 0
    }
})

const { State: TextInputState } = TextInput

interface KeyboardViewProps extends PropsWithChildren<any> {
    style?: StyleProp<ViewStyle>
}

const KeyboardView = ({ children, style = {} }: KeyboardViewProps) => {
    const [shift] = useState(new Animated.Value(0))

    const onKeyboardDidShow = (event: KeyboardEvent) => {
        const { height: windowHeight } = Dimensions.get("window")
        const keyboardHeight = event.endCoordinates.height
        const currentlyFocusedField = TextInputState.currentlyFocusedField()
        UIManager.measure(currentlyFocusedField, (originX, originY, width, height, pageX, pageY) => {
            const fieldHeight = height
            const fieldTop = pageY
            const gap = windowHeight - keyboardHeight - (fieldTop + fieldHeight) - fieldHeight
            if (gap >= 0) {
                return
            }
            Animated.timing(shift, {
                toValue: gap,
                duration: 500,
                useNativeDriver: true
            }).start()
        })
    }

    const onKeyboardDidHide = (event: KeyboardEvent) => {
        Animated.timing(shift, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true
        }).start()
    }

    useEffect(() => {
        const keyboardDidShow = Keyboard.addListener("keyboardDidShow", onKeyboardDidShow)
        const keyboardDidHide = Keyboard.addListener("keyboardDidHide", onKeyboardDidHide)

        return () => {
            keyboardDidShow.remove()
            keyboardDidHide.remove()
        }
    }, [])

    return <Animated.View style={[styleSheet.container, style, { transform: [{ translateY: shift }] }]}>{children}</Animated.View>
}

export default KeyboardView
