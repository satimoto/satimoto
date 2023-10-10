import { DefaultTheme, DarkTheme as DefaultDarkTheme } from "@react-navigation/native"
import { extendTheme } from "native-base"

const LightTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors
    }
}

const DarkTheme = {
    ...DefaultDarkTheme,
    colors: {
        ...DefaultDarkTheme.colors
    }
}

const colors = {
    blue: {
        50: "#d9f7ff",
        100: "#ace1ff",
        200: "#7cccff",
        300: "#49b8ff",
        400: "#1aa3ff",
        500: "#008ae6",
        600: "#006bb4",
        700: "#004c82",
        800: "#002e51",
        900: "#001021"
    },
    cyan: {
        50: "#d7feff",
        100: "#aaf3ff",
        200: "#7aeaff",
        300: "#48e0ff",
        400: "#1ad8ff",
        500: "#00bee6",
        600: "#0094b4",
        700: "#006a82",
        800: "#004050",
        900: "#00171f"
    },
    green: {
        50: "#e6fde3",
        100: "#c3f4bb",
        200: "#9eea92",
        300: "#7ae269",
        400: "#55da3f",
        500: "#3bc025",
        600: "#2c951b",
        700: "#1e6b12",
        800: "#0f4107",
        900: "#001700"
    },
    indigo: {
        50: "#f8e3ff",
        100: "#e0b2ff",
        200: "#c97fff",
        300: "#b24cff",
        400: "#9d1aff",
        500: "#8300e6",
        600: "#6600b4",
        700: "#490082",
        800: "#2c0050",
        900: "#110020"
    },
    pink: {
        50: "#ffe2ff",
        100: "#fdb1ff",
        200: "#f77fff",
        300: "#f34cff",
        400: "#ef1aff",
        500: "#d500e6",
        600: "#a700b4",
        700: "#770081",
        800: "#49004f",
        900: "#1c001f"
    },
    purple: {
        50: "#f4e3ff",
        100: "#d7b2ff",
        200: "#bb7fff",
        300: "#a04cff",
        400: "#851aff",
        500: "#6b00e6",
        600: "#5300b4",
        700: "#3b0082",
        800: "#240050",
        900: "#0e0020"
    },
    orange: {
        50: "#fff7da",
        100: "#ffe6ad",
        200: "#ffd67d",
        300: "#ffc64b",
        400: "#ffb51a",
        500: "#e69c00",
        600: "#b37900",
        700: "#815700",
        800: "#4e3400",
        900: "#1e1000"
    },
    red: {
        50: "#ffe1f6",
        100: "#ffb1dc",
        200: "#ff7ec5",
        300: "#ff4cac",
        400: "#ff1a94",
        500: "#e6007a",
        600: "#b4005f",
        700: "#820044",
        800: "#500029",
        900: "#200010"
    },
    teal: {
        50: "#d8ffff",
        100: "#acfffc",
        200: "#7dfff9",
        300: "#4dfff6",
        400: "#27fff3",
        500: "#16e6da",
        600: "#00b3a9",
        700: "#008079",
        800: "#004e49",
        900: "#001c19"
    },
    yellow: {
        50: "#fcfede",
        100: "#f5f8b5",
        200: "#eff389",
        300: "#e8ee5c",
        400: "#e2e930",
        500: "#c8cf16",
        600: "#9ca10d",
        700: "#6f7305",
        800: "#424500",
        900: "#161800"
    }
}

const NativeBaseTheme = extendTheme({
    colors: {
        primary: colors.blue,
        secondary: colors.indigo,
        tertiary: colors.teal,
        danger: colors.red,
        error: colors.red,
        success: colors.blue,
        warning: colors.yellow,
        info: colors.cyan,
        pink: colors.pink,
        purple: colors.purple,
        indigo: colors.indigo,
        blue: colors.blue,
        cyan: colors.cyan,
        teal: colors.teal,
        green: colors.green,
        yellow: colors.yellow,
        orange: colors.orange,
        red: colors.red
    },
    components: {
        Input: {
            baseStyle: {
                _disabled: {
                    backgroundColor: "muted.600",
                    borderColor: "muted.600"
                }
            }
        }
    },
    useSystemColorMode: false,
    initialColorMode: "dark"
})

export { LightTheme, DarkTheme, NativeBaseTheme }
