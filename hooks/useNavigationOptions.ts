import { NativeStackNavigationOptions } from "@react-navigation/native-stack"
import { useTheme } from "native-base"
import useColor from "./useColor"

const useNavigationOptions = (options: NativeStackNavigationOptions = {}): NativeStackNavigationOptions => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const textColor = useColor(colors.warmGray[50], colors.dark[200])

    return {
        animation: "none",
        headerStyle: {
            backgroundColor: backgroundColor
        },
        headerTintColor: textColor,
        headerTitleStyle: {
            color: textColor
        },
        ...options
    }
}

export default useNavigationOptions
