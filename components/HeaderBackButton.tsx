import { faChevronLeft } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { IconButton } from "native-base"
import React from "react"

const HeaderBackButton = ({ tintColor = "#ffffff", onPress = () => {} }) => {
    return (
        <IconButton
            colorScheme="muted"
            variant="ghost"
            onPress={onPress}
            icon={<FontAwesomeIcon icon={faChevronLeft} />}
            _icon={{ color: tintColor, size: 20 }}
        />
    )
}

export default HeaderBackButton
