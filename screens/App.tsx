import React, { useEffect } from "react"
import { Provider } from "mobx-react"
import * as protobuf from "protobufjs"
import { useColorScheme, AppState, AppStateStatus } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { store } from "stores/Store"
import AppDrawerScreen from "screens/AppDrawer"
import { LightTheme, DarkTheme, NativeBaseTheme } from "utils/theme"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { NativeBaseProvider } from "native-base"
import { Log } from "utils/logging"

global.process = require("../polyfills/process")
protobuf.util.toJSONOptions = { defaults: true }

const log = new Log("App")

const AppStack = createNativeStackNavigator()
const AppStackScreen = () => (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
        <AppStack.Screen name="App" component={AppDrawerScreen} />
    </AppStack.Navigator>
)

const App = () => {
    const isDarkMode = useColorScheme() === "dark"

    const appStateChanged = (state: AppStateStatus) => {
        log.debug(`App state changed: ${state}`)
    }

    useEffect(() => {
        AppState.addEventListener('change', appStateChanged)

        return (() => {
            AppState.removeEventListener('change', appStateChanged)
        })
    })

    return (
        <NativeBaseProvider theme={NativeBaseTheme}>
            <SafeAreaProvider>
                <Provider store={store}>
                    <NavigationContainer theme={isDarkMode ? DarkTheme : LightTheme}>
                        <AppStackScreen />
                    </NavigationContainer>
                </Provider>
            </SafeAreaProvider>
        </NativeBaseProvider>
    )
}

export default App
