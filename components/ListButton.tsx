import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import useColor from "hooks/useColor"
import { HStack, Spacer, Text, useTheme, VStack } from "native-base"
import React from "react"
import { GestureResponderEvent } from "react-native"
import styles from "utils/styles"
import { IconProp } from "@fortawesome/fontawesome-svg-core"

interface ListButtonProps {
    title: string
    hint?: string
    iconRight?: IconProp
    onPress?: (event: GestureResponderEvent) => void
}

const ListButton = ({ title, hint, iconRight, onPress = () => {} }: ListButtonProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.gray[500], colors.warmGray[50])
    const textColor = useColor(colors.lightText, colors.darkText)

    return (
        <TouchableOpacityOptional onPress={onPress} style={[styles.listButton, styles.buttonMinHeight, { backgroundColor }]}>
            <HStack alignItems="center">
                <VStack>
                    <Text color="white" fontSize="lg" fontWeight="bold">
                        {title}
                    </Text>
                    {hint && (
                        <Text color="gray.300" fontSize="sm">
                            {hint}
                        </Text>
                    )}
                </VStack>
                <Spacer />
                <VStack alignItems="flex-end">{iconRight && <FontAwesomeIcon color={textColor} icon={iconRight} />}</VStack>
            </HStack>
        </TouchableOpacityOptional>
    )
}

export default ListButton
