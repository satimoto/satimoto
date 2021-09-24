import React from "react"
import { createDrawerNavigator } from "@react-navigation/drawer"
import DeveloperStackScreen from "screens/DeveloperStack"
import WalletStackScreen from "screens/WalletStack"

const AppDrawer = createDrawerNavigator()

const AppDrawerScreen = () => (
    <AppDrawer.Navigator initialRouteName="Developer Drawer" screenOptions={{headerShown: false}}>
        <AppDrawer.Screen name="Wallet Drawer" component={WalletStackScreen} options={{ drawerLabel: "Wallet" }} />
        <AppDrawer.Screen name="Developer Drawer" component={DeveloperStackScreen} options={{ drawerLabel: "Developer" }} />
    </AppDrawer.Navigator>
)

export default AppDrawerScreen
