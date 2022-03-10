import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { IconButton } from "native-base"
import React from "react"
import { GestureResponderEvent } from "react-native"

interface HeaderButtonProps {
    icon: IconProp
    tintColor?: string
    onPress?: (event: GestureResponderEvent) => void
}

const HeaderButton = ({ icon, tintColor = "#ffffff", onPress = () => {} }: HeaderButtonProps) => {
    return (
        <IconButton
            colorScheme="muted"
            variant="ghost"
            onPress={onPress}
            icon={<FontAwesomeIcon icon={icon} />}
            _icon={{ color: tintColor, size: 20 }}
        />
    )
}

export default HeaderButton
