import { HStack } from "native-base"
import React, { PropsWithChildren } from "react"
import { ResponsiveValue } from "native-base/lib/typescript/components/types"

interface PillTrayProps extends PropsWithChildren {
    marginTop?: number
    space?: number
    justifyContent?: ResponsiveValue<"flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly" | undefined>
}

const PillTray = ({ children, space = 0, marginTop = 0, justifyContent = "space-evenly" }: PillTrayProps) => {
    return (
        <HStack alignItems="flex-start" flexWrap="wrap" marginTop={marginTop} justifyContent={justifyContent} space={space}>
            {children}
        </HStack>
    )
}

export default PillTray
