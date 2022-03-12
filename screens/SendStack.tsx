import React from "react"
import SendCamera from "screens/SendCamera"
import { createNativeStackNavigator, NativeStackNavigationProp } from "@react-navigation/native-stack"
import useNavigationOptions from "hooks/useNavigationOptions"

export type SendStackParamList = {
    SendCamera: undefined
}

export type SendCameraNavigationProp = NativeStackNavigationProp<SendStackParamList, "SendCamera">

const SendStackNav = createNativeStackNavigator<SendStackParamList>()

const SendStack = () => {
    const navigationOptions = useNavigationOptions()

    return (
        <SendStackNav.Navigator initialRouteName="SendCamera" screenOptions={{ headerShown: false }}>
            <SendStackNav.Screen name="SendCamera" component={SendCamera} options={navigationOptions} />
        </SendStackNav.Navigator>
    )
}

export default SendStack
