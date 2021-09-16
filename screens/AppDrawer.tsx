import React from "react"
import { createDrawerNavigator } from "@react-navigation/drawer"
import WalletStackScreen from "screens/WalletStack"

const AppDrawer = createDrawerNavigator()

const AppDrawerScreen = () => (
    <AppDrawer.Navigator initialRouteName="Wallet" screenOptions={{headerShown: false}}>
        <AppDrawer.Screen name="Wallet" component={WalletStackScreen} options={{ drawerLabel: "Wallet" }} />
    </AppDrawer.Navigator>
)

export default AppDrawerScreen
