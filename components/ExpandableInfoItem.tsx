import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import { faInfo } from "@fortawesome/free-solid-svg-icons"
import { HStack, Spacer, Text, VStack, useColorModeValue } from "native-base"
import React, { PropsWithChildren, useState } from "react"
import styles from "utils/styles"
import { View } from "react-native"
import IconButton from "components/IconButton"

interface ExpandableInfoItemProps extends PropsWithChildren<any> {
    title: string
}

const ExpandableInfoItem = ({ title, children }: ExpandableInfoItemProps) => {
    const secondaryTextColor = useColorModeValue("warmGray.200", "dark.200")
    const [isExpanded, setIsExpanded] = useState(false)

    const onPress = () => {
        setIsExpanded(!isExpanded)
    }

    return (
        <TouchableOpacityOptional onPress={onPress}>
            <HStack alignItems="center" space={1} marginTop={1}>
                <VStack flexBasis={0} flexGrow={12}>
                    <Text color={secondaryTextColor} fontSize="xs">
                        {title}
                    </Text>
                </VStack>
                <Spacer />
                <VStack>
                    <IconButton size="sm" icon={faInfo} onPress={onPress} />
                </VStack>
            </HStack>
            {isExpanded && <View style={styles.expandableItem}>{children}</View>}
        </TouchableOpacityOptional>
    )
}

export default ExpandableInfoItem
