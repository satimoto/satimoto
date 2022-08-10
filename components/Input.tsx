import { IInputProps, Input as NBInput, useColorModeValue } from "native-base"
import React from "react"

const Input = ({ color, size = "md", ...props }: IInputProps) => {
    if (!color) {
        color = useColorModeValue("warmGray.50", "dark.200")
    }

    return <NBInput color={color} size={size} {...props} />
}

export default Input
