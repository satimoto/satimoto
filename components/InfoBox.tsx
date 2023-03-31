import { Box } from "native-base"
import { ColorType } from "native-base/lib/typescript/components/types"
import React, { PropsWithChildren } from "react"

interface InfoBoxItemProps extends PropsWithChildren<any> {
    color?: ColorType
}

const InfoBoxItem = ({ color, children }: InfoBoxItemProps) => {
    return (
        <Box borderWidth={1} borderColor={color} borderRadius={15} margin={2} padding={3}>
            {children}
        </Box>
    )
}

export default InfoBoxItem
