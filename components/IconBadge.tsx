import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import React from "react"
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native"

const styleSheet = StyleSheet.create({
    badge: {
        width: 10,
        height: 10
    }
})

interface IconBadgeProps {
    icon: IconProp
    color?: string
    style?: StyleProp<ViewStyle>
}

const IconBadge = ({ icon, color = "#ffffff", style = {} }: IconBadgeProps) => {
    return <View style={[style, styleSheet.badge]}>
        <FontAwesomeIcon color={color} icon={icon} />
    </View>
}

export default IconBadge
