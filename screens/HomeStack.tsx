import React from "react"
import Home from "screens/Home"
import { createNativeStackNavigator, NativeStackNavigationProp } from "@react-navigation/native-stack"

type HomeStackParamList = {
    Home: undefined
}

type HomeNavigationProp = NativeStackNavigationProp<HomeStackParamList, "Home">

const HomeStackNav = createNativeStackNavigator<HomeStackParamList>()

const HomeStack = () => (
    <HomeStackNav.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <HomeStackNav.Screen name="Home" component={Home} />
    </HomeStackNav.Navigator>
)

export default HomeStack

export type { HomeStackParamList, HomeNavigationProp }
