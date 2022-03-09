import HeaderBackButton from "components/HeaderBackButton"
import React from "react"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationOptions } from "@react-navigation/native-stack"
import { useTheme } from "native-base"
import useColor from "./useColor"

const useNavigationOptions = (options: NativeStackNavigationOptions = {}): NativeStackNavigationOptions => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const textColor = useColor(colors.warmGray[50], colors.dark[200])
    const navigation = useNavigation()

    return {
        animation: "none",
        headerStyle: {
            backgroundColor: backgroundColor
        },
        headerLeft: () => <HeaderBackButton tintColor={textColor} onPress={() => navigation.goBack()} />,
        headerTintColor: textColor,
        headerTitleStyle: {
            color: textColor
        },
        ...options
    }
}

export default useNavigationOptions
