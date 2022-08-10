import { ISpinnerProps, Spinner } from "native-base"
import React, { PropsWithChildren } from "react"

interface BusySpinnerProps extends PropsWithChildren<any>, ISpinnerProps {
    isBusy: boolean
}

const BusySpinner = ({ children, isBusy, marginTop, size }: BusySpinnerProps) => {
    return isBusy ? <Spinner marginTop={marginTop} size={size} /> : <>{children}</>
}

export default BusySpinner
