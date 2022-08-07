import Badge from "components/Badge"
import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import React, { useState } from "react"
import { StyleSheet, View } from "react-native"
import { HStack, Text, useColorModeValue } from "native-base"

const styleSheet = StyleSheet.create({
    touchableOpacity: {
        marginTop: 10,
        marginBottom: 20
    },
    barItem: {
        padding: 4
    },
    barItemLeft: {
        borderBottomLeftRadius: 5,
        borderTopLeftRadius: 5
    },
    barItemRight: {
        borderBottomRightRadius: 5,
        borderTopRightRadius: 5
    }
})

export type StackedBarItem = {
    color: string
    label: string
    percent: number
}

export type StackedBarItems = StackedBarItem[]

interface StackedBarProps {
    items: StackedBarItems
}

const StackedBar = ({ items }: StackedBarProps) => {
    const [showLegend, setShowLegend] = useState(false)

    const onPress = () => {
        setShowLegend(!showLegend)
    }

    return (
        <TouchableOpacityOptional onPress={onPress}>
            <View style={[styleSheet.touchableOpacity]}>
                <HStack>
                    {items.map((item, index) => (
                        <View
                            style={[
                                styleSheet.barItem,
                                index === 0 ? styleSheet.barItemLeft : index === items.length - 1 ? styleSheet.barItemRight : {},
                                { backgroundColor: item.color, flexBasis: `${item.percent}%` }
                            ]}
                        ></View>
                    ))}
                </HStack>
                {showLegend && (
                    <HStack marginTop={1} flexWrap="wrap">
                        {items.map((item) => (
                            <StackBarLegendItem key={item.label} item={item} />
                        ))}
                    </HStack>
                )}
            </View>
        </TouchableOpacityOptional>
    )
}

interface StackBarLegendItemProps {
    item: StackedBarItem
}

const StackBarLegendItem = ({ item }: StackBarLegendItemProps) => {
    const textColor = useColorModeValue("lightText", "darkText")

    return (
        <HStack>
            <Badge color={item.color} style={{ margin: 6 }} />
            <Text color={textColor}>{item.label}</Text>
        </HStack>
    )
}

export default StackedBar
