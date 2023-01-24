import { IconButton as NBIconButton, View } from "native-base"
import React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { ResponsiveValue, VariantType } from "native-base/lib/typescript/components/types"
import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { ISizes } from "native-base/lib/typescript/theme/base/sizes"

interface IconButtonProps {
    icon: IconProp
    color?: string
    variant?: VariantType<'IconButton'>
    size?: ResponsiveValue<ISizes | (string & {}) | number>
    borderRadius?: ResponsiveValue<"sm" | "md" | "lg" | "xl" | "2xl" | (string & {}) | "none" | (number & {}) | "xs" | "3xl" | "full">
    onPress?: () => void
}

const IconButton = ({ icon, color = "#ffffff", variant = "outline", borderRadius = "xl", onPress = () => {}, ...props }: IconButtonProps) => {
    return (
        <NBIconButton
            variant={variant}
            borderRadius={borderRadius}
            onPress={onPress}
            icon={<FontAwesomeIcon icon={icon} />}
            _icon={{ color: "#ffffff" }}
            {...props}
        />
    )
}

export default IconButton
