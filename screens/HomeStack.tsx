import React from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import Home from "screens/Home"

const HomeStack = createNativeStackNavigator()

const HomeStackScreen = () => (
    <HomeStack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <HomeStack.Screen name="Home" component={Home} />
    </HomeStack.Navigator>
)

export default HomeStackScreen
