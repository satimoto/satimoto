import { useNavigation } from "@react-navigation/native"
import { createNativeStackNavigator, NativeStackNavigationOptions, NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import React, { useEffect } from "react"
import DeveloperStack, { DeveloperStackParamList } from "screens/DeveloperStack"
import HomeStack, { HomeStackParamList } from "screens/HomeStack"
import ReceiveStack, { ReceiveStackParamList } from "screens/ReceiveStack"
import SendStack, { SendStackParamList } from "screens/SendStack"
import TransactionStack, { TransactionStackParamList } from "screens/TransactionStack"

export type AppStackParamList = {
    Home: undefined
    Developer: undefined
    Receive: undefined
    Send: undefined
    Transaction: undefined
}

export type HomeNavigationProp = NativeStackNavigationProp<AppStackParamList, "Home">
export type DeveloperNavigationProp = NativeStackNavigationProp<AppStackParamList, "Developer">
export type ReceiveNavigationProp = NativeStackNavigationProp<AppStackParamList, "Receive">
export type SendNavigationProp = NativeStackNavigationProp<AppStackParamList, "Send">
export type TransactionNavigationProp = NativeStackNavigationProp<AppStackParamList, "Transaction">

export type SubstacksParamList = HomeStackParamList & DeveloperStackParamList & ReceiveStackParamList & SendStackParamList & TransactionStackParamList

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
            <AppStackNav.Screen name="Send" component={SendStack} options={options} />
            <AppStackNav.Screen name="Transaction" component={TransactionStack} options={options} />
        </AppStackNav.Navigator>
    )
}

export default AppStack
