import RoundedButton from "components/RoundedButton"
import { Button, IButtonProps, Spinner } from "native-base"
import { ResponsiveValue } from "native-base/lib/typescript/components/types"
import React from "react"

interface BusyButtonProps extends IButtonProps {
    isBusy: boolean
    spinnerSize?: ResponsiveValue<"sm" | "lg">
}

const BusyButton = ({ children, isBusy, marginBottom, marginTop, spinnerSize = "lg", ...props }: BusyButtonProps) => {
    return isBusy ? (
        <Spinner marginBottom={marginBottom} marginTop={marginTop} size={spinnerSize} />
    ) : (
        <RoundedButton marginBottom={marginBottom} marginTop={marginTop} {...props}>
            {children}
        </RoundedButton>
    )
}

export default BusyButton
