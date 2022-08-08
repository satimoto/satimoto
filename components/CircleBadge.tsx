import React from "react"
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native"

const styleSheet = StyleSheet.create({
    badge: {
        width: 15,
        height: 15,
        borderRadius: 10
    }
})

interface CircleBadgeProps {
    color: string
    style?: StyleProp<ViewStyle>
}

const CircleBadge = ({ color, style = {} }: CircleBadgeProps) => {
    return <View style={[style, styleSheet.badge, { backgroundColor: color }]}></View>
}

export default CircleBadge
