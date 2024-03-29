import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faSortDown, faSortUp } from "@fortawesome/free-solid-svg-icons"
import useColor from "hooks/useColor"
import { HStack, Spacer, Text, useTheme, VStack } from "native-base"
import React, { PropsWithChildren, useState } from "react"
import styles from "utils/styles"
import { View } from "react-native"

interface ExpandableListItemProps extends PropsWithChildren<any> {
    title: string
}

const ExpandableListItem = ({ title, children }: ExpandableListItemProps) => {
    const { colors } = useTheme()
    const textColor = useColor(colors.lightText, colors.darkText)
    const [isExpanded, setIsExpanded] = useState(false)

    const onPress = () => {
        setIsExpanded(!isExpanded)
    }

    return (
        <TouchableOpacityOptional onPress={onPress}>
            <HStack alignItems="center" space={1}>
                <VStack>
                    <Text color="white" fontSize="lg" fontWeight="bold">
                        {title}
                    </Text>
                </VStack>
                <Spacer />
                <VStack alignItems="flex-end">
                    <FontAwesomeIcon color={textColor} icon={isExpanded ? faSortUp : faSortDown} />
                </VStack>
            </HStack>
            {isExpanded && (<View style={styles.expandableItem}>{children}</View>)}
        </TouchableOpacityOptional>
    )
}

export default ExpandableListItem
