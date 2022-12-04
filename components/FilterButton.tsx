import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faFilter } from "@fortawesome/free-solid-svg-icons"
import { IconButton, useTheme } from "native-base"
import React from "react"
import { GestureResponderEvent, StyleProp, ViewStyle } from "react-native"
import useColor from "hooks/useColor"


interface FilterButtonProps {
    onPress: (event: GestureResponderEvent) => void
    color?: string
    size?: number
}

const FilterButton = ({ onPress, color, size = 20 }: FilterButtonProps) => {
    const { colors } = useTheme()
    let textColor = useColor(colors.darkText, colors.lightText)

    if (color) {
        textColor = color
    }
    
    return (
        <IconButton
            borderRadius="full"
            size="lg"
            padding={3}
            backgroundColor={colors.white}
            variant="solid"
            onPress={onPress}
            icon={<FontAwesomeIcon icon={faFilter} />}
            _icon={{ color: textColor, size }}
        />
    )
}

export default FilterButton
