import React from "react"
import ReceiveBitcoin from "screens/ReceiveBitcoin"
import ReceiveLightning from "screens/ReceiveLightning"
import ReceiveQr from "screens/ReceiveQr"
import { createNativeStackNavigator, NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RouteProp } from "@react-navigation/native"
import useNavigationOptions from "hooks/useNavigationOptions"

export type ReceiveStackParamList = {
    ReceiveBitcoin: undefined
    ReceiveLightning: undefined
    ReceiveQr: { qrCode: string }
}

export type ReceiveBitcoinNavigationProp = NativeStackNavigationProp<ReceiveStackParamList, "ReceiveBitcoin">
export type ReceiveLightningNavigationProp = NativeStackNavigationProp<ReceiveStackParamList, "ReceiveLightning">
export type ReceiveQrNavigationProp = NativeStackNavigationProp<ReceiveStackParamList, "ReceiveQr">
export type ReceiveQrRouteProp = RouteProp<ReceiveStackParamList, "ReceiveQr">

const ReceiveStackNav = createNativeStackNavigator<ReceiveStackParamList>()

const ReceiveStack = () => {
    const navigationOptions = useNavigationOptions({ headerShown: true })

    return (
        <ReceiveStackNav.Navigator initialRouteName="ReceiveLightning" screenOptions={{ headerShown: false }}>
            <ReceiveStackNav.Screen name="ReceiveBitcoin" component={ReceiveBitcoin} options={navigationOptions} />
            <ReceiveStackNav.Screen name="ReceiveLightning" component={ReceiveLightning} options={navigationOptions} />
            <ReceiveStackNav.Screen name="ReceiveQr" component={ReceiveQr} options={navigationOptions} />
        </ReceiveStackNav.Navigator>
    )
}

export default ReceiveStack
