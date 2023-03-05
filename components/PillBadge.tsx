import React from "react"
import { Text } from "react-native"
import { Badge, IBadgeProps } from "native-base"

interface PillBadgeProps extends IBadgeProps {
    label: string
    textColor?: string
}

const PillBadge = ({ label, textColor = "#fff", ...props }: PillBadgeProps) => {
    return (
        <Badge borderRadius="full" paddingY={2} paddingX={1} {...props}>
            <Text style={{ color: textColor }}>{label}</Text>
        </Badge>
    )
}

export default PillBadge
