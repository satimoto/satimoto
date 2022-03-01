import React from "react"
import Developer from "screens/Developer"
import { createNativeStackNavigator, NativeStackNavigationOptions, NativeStackNavigationProp } from "@react-navigation/native-stack"

type DeveloperStackParamList = {
    Developer: undefined
}

type DeveloperNavigationProp = NativeStackNavigationProp<DeveloperStackParamList, "Developer">

const DeveloperStackNav = createNativeStackNavigator<DeveloperStackParamList>()

const screenOptions: NativeStackNavigationOptions = {
    headerShown: false
}

const DeveloperStack = () => (
    <DeveloperStackNav.Navigator initialRouteName="Developer" screenOptions={screenOptions}>
        <DeveloperStackNav.Screen name="Developer" component={Developer} />
    </DeveloperStackNav.Navigator>
)

export default DeveloperStack

export type { DeveloperStackParamList, DeveloperNavigationProp }
