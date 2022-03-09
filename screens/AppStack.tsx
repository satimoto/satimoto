import { createNativeStackNavigator, NativeStackNavigationOptions, NativeStackNavigationProp } from "@react-navigation/native-stack"
import React from "react"
import TransactionStack, { TransactionStackParamList } from "screens/TransactionStack"
import DeveloperStack, { DeveloperStackParamList } from "screens/DeveloperStack"
import HomeStack, { HomeStackParamList } from "screens/HomeStack"
import ReceiveStack, { ReceiveStackParamList } from "screens/ReceiveStack"

type AppStackParamList = {
    Home: undefined
    Developer: undefined
    Receive: undefined
    Transaction: undefined
}

type HomeNavigationProp = NativeStackNavigationProp<AppStackParamList, "Home">
type DeveloperNavigationProp = NativeStackNavigationProp<AppStackParamList, "Developer">
type ReceiveNavigationProp = NativeStackNavigationProp<AppStackParamList, "Receive">
type TransactionNavigationProp = NativeStackNavigationProp<AppStackParamList, "Transaction">

type SubstacksParamList = HomeStackParamList & DeveloperStackParamList & ReceiveStackParamList & TransactionStackParamList

const screenOptions: NativeStackNavigationOptions = {
    headerShown: false
}

const options: NativeStackNavigationOptions = {
    animation: "none"
}

const AppStackNav = createNativeStackNavigator<AppStackParamList>()

const AppStack = () => {
    return (
        <AppStackNav.Navigator initialRouteName={"Home"} screenOptions={screenOptions}>
            <AppStackNav.Screen name="Home" component={HomeStack} options={options} />
            <AppStackNav.Screen name="Developer" component={DeveloperStack} options={{ ...options, headerShown: true }} />
            <AppStackNav.Screen name="Receive" component={ReceiveStack} options={options} />
            <AppStackNav.Screen name="Transaction" component={TransactionStack} options={options} />
        </AppStackNav.Navigator>
    )
}

export default AppStack

export type { AppStackParamList, SubstacksParamList, HomeNavigationProp, DeveloperNavigationProp, ReceiveNavigationProp, TransactionNavigationProp }
