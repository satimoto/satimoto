import React, { PropsWithChildren } from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { IS_ANDROID } from "utils/constants"

interface PlatformSafeAreaViewProps extends PropsWithChildren<any> {
    style?: StyleProp<ViewStyle>
}

const PlatformSafeAreaView = ({ children, style = {} }: PlatformSafeAreaViewProps) => {
    return IS_ANDROID ? <SafeAreaView style={style}>{children}</SafeAreaView> : <View style={style}>{children}</View>
}

export default PlatformSafeAreaView
