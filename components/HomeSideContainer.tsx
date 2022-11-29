import { VStack } from "native-base"
import React, { PropsWithChildren } from "react"
import { LayoutChangeEvent, StyleSheet } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const styleSheet = StyleSheet.create({
    button: {
        position: "absolute",
        alignItems: "flex-end"
    }
})

interface HomeSideContainerProps extends PropsWithChildren<any> {
    top?: number
    onLayout?: (event: LayoutChangeEvent) => void
}

const HomeSideContainer = ({ children, top, onLayout = () => {}, ...props }: HomeSideContainerProps) => {
    const safeAreaInsets = useSafeAreaInsets()
    top = top || safeAreaInsets.top

    return (
        <VStack space={3} style={[{ top: 20 + top, right: 10 + safeAreaInsets.right }, styleSheet.button]} onLayout={onLayout} {...props}>
            {children}
        </VStack>
    )
}

export default HomeSideContainer
