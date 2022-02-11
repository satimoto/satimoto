import React from "react"
import { createDrawerNavigator } from "@react-navigation/drawer"
import DeveloperStackScreen from "screens/DeveloperStack"
import HomeStackScreen from "screens/HomeStack"

const AppDrawer = createDrawerNavigator()

const AppDrawerScreen = () => (
    <AppDrawer.Navigator initialRouteName="Wallet Drawer" screenOptions={{ headerShown: false }}>
        <AppDrawer.Screen name="Wallet Drawer" component={HomeStackScreen} options={{ drawerLabel: "Wallet" }} />
        <AppDrawer.Screen name="Developer Drawer" component={DeveloperStackScreen} options={{ drawerLabel: "Developer" }} />
    </AppDrawer.Navigator>
)

export default AppDrawerScreen
