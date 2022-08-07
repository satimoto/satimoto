import React from "react"
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native"

const styleSheet = StyleSheet.create({
    badge: {
        width: 10,
        height: 10,
        borderRadius: 10
    }
})

interface BadgeProps {
    color: string
    style?: StyleProp<ViewStyle>
}

const Badge = ({ color, style = {} }: BadgeProps) => {
    return <View style={[style, styleSheet.badge, { backgroundColor: color }]}></View>
}

export default Badge
