import React, { PropsWithChildren } from "react"
import { ImageBackground, ImageSourcePropType, StyleProp, ViewStyle } from "react-native"

interface ButtonIconProps extends PropsWithChildren<any> {
    source: ImageSourcePropType
    size?: number
    style?: StyleProp<ViewStyle>
}

const ButtonIcon = ({ children, size = 50, source, style = {} }: ButtonIconProps) => {
    return (
        <ImageBackground resizeMode="contain" source={source} style={[{ width: size, height: size, justifyContent: "center" }, style]}>
            {children}
        </ImageBackground>
    )
}

export default ButtonIcon
