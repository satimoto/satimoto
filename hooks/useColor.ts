import { useColorMode } from "native-base"

const useColor = (light: string, dark: string) => {
    const { colorMode } = useColorMode()

    return colorMode === "dark" ? dark : light
}

export default useColor