import React from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import Wallet from "screens/Wallet"

const WalletStack = createNativeStackNavigator()

const WalletStackScreen = () => (
    <WalletStack.Navigator initialRouteName="Home" screenOptions={{headerShown: false}}>
        <WalletStack.Screen name="Home" component={Wallet} />
    </WalletStack.Navigator>
)

export default WalletStackScreen
