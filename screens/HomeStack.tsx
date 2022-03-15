import React from "react"
import Home from "screens/Home"
import { createNativeStackNavigator, NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RouteProp } from "@react-navigation/native"

export type HomeStackParamList = {
    Home: { lnUrlAuth?: string }
}

export type HomeNavigationProp = NativeStackNavigationProp<HomeStackParamList, "Home">
export type HomeRouteProp = RouteProp<HomeStackParamList, "Home">

const HomeStackNav = createNativeStackNavigator<HomeStackParamList>()

const HomeStack = () => (
    <HomeStackNav.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <HomeStackNav.Screen name="Home" component={Home} />
    </HomeStackNav.Navigator>
)

export default HomeStack
