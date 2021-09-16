import React from "react"
import { useColorScheme } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { Provider } from "mobx-react"
import { store } from "stores/Store"
import AppDrawerScreen from "screens/AppDrawer"
import { LightTheme, DarkTheme } from "utils/theme"

const AppStack = createNativeStackNavigator()
const AppStackScreen = () => (
    <AppStack.Navigator screenOptions={{headerShown: false}}>
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
