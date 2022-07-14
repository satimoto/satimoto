import React, { PropsWithChildren } from "react"
import { ImageBackground, ImageSourcePropType, FlexStyle } from "react-native"

interface ButtonIconProps extends PropsWithChildren<any> {
    source: ImageSourcePropType
    size?: number
    justifyContent?: FlexStyle["justifyContent"]
}

const ButtonIcon = ({ children, size = 50, justifyContent = "center", source }: ButtonIconProps) => {
    return (
        <ImageBackground resizeMode="contain" source={source} style={{ width: size, height: size, justifyContent }}>
            {children}
        </ImageBackground>
    )
}

export default ButtonIcon
