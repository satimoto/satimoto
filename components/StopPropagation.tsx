import React, { PropsWithChildren } from "react"
import { View } from "react-native"

const StopPropagation = ({ children }: PropsWithChildren<any>) => {
    return (
        <View onStartShouldSetResponder={(event) => true} onTouchEnd={(event) => event.stopPropagation()}>
            {children}
        </View>
    )
}

export default StopPropagation
