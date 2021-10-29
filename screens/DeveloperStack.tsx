import React from "react"
import { DrawerNavigationProp } from "@react-navigation/drawer"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import Developer from "screens/Developer"

type DeveloperStackParamList = {
    Developer: undefined
}

const DeveloperStack = createNativeStackNavigator()

const DeveloperStackScreen = () => (
    <DeveloperStack.Navigator initialRouteName="Developer">
        <DeveloperStack.Screen name="Developer" component={Developer} />
    </DeveloperStack.Navigator>
)

export type DeveloperStackNavigationProp = DrawerNavigationProp<DeveloperStackParamList, "Developer">

export default DeveloperStackScreen
