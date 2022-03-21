import { faChevronLeft } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { IconButton, IIconButtonProps } from "native-base"
import React from "react"

interface HeaderBackButtonProps extends IIconButtonProps {
    tintColor?: string
    onPress?: () => void
}

const HeaderBackButton = ({ colorScheme = "muted", variant = "ghost", tintColor = "#ffffff", onPress = () => {}, ...props }: HeaderBackButtonProps) => {
    return (
        <IconButton
            colorScheme={colorScheme}
            variant={variant}
            onPress={onPress}
            icon={<FontAwesomeIcon icon={faChevronLeft} />}
            _icon={{ color: tintColor, size: 20 }}
            {...props}
        />
    )
}

export default HeaderBackButton
