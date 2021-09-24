import React from "react"
import { Provider } from "mobx-react"
import * as protobuf from "protobufjs"
import { useColorScheme } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { store } from "stores/Store"
import AppDrawerScreen from "screens/AppDrawer"
import { LightTheme, DarkTheme } from "utils/theme"

global.process = require("../polyfills/process")
protobuf.util.toJSONOptions = { defaults: true }
  
const AppStack = createNativeStackNavigator()
const AppStackScreen = () => (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
        <AppStack.Screen name="App" component={AppDrawerScreen} />
    </AppStack.Navigator>
)

const App = () => {
    const isDarkMode = useColorScheme() === "dark"

    return (
        <Provider store={store}>
            <NavigationContainer theme={isDarkMode ? DarkTheme : LightTheme}>
                <AppStackScreen />
            </NavigationContainer>
        </Provider>
    )
}

export default App
