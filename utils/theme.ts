import React from "react"
import { DefaultTheme, DarkTheme as DefaultDarkTheme } from "@react-navigation/native"

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

export {
    LightTheme, DarkTheme
}