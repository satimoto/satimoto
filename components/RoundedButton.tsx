import { Button, IButtonProps } from "native-base"
import React from "react"

const RoundedButton = ({ children, borderRadius = "3xl", size = "lg", ...props }: IButtonProps) => {
    return (
        <Button borderRadius={borderRadius} size={size} {...props}>
            {children}
        </Button>
    )
}

export default RoundedButton
