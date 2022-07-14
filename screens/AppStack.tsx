import useNavigationOptions from "hooks/useNavigationOptions"
import ConnectorModel from "models/Connector"
import EvseModel from "models/Evse"
import { createNativeStackNavigator, NativeStackNavigationOptions } from "@react-navigation/native-stack"
import React from "react"
import ConnectorDetail from "screens/ConnectorDetail"
import Developer from "screens/Developer"
import EvseList from "screens/EvseList"
import Home from "screens/Home"
import ReceiveBitcoin from "screens/ReceiveBitcoin"
import ReceiveLightning from "screens/ReceiveLightning"
import ReceiveQr from "screens/ReceiveQr"
import SendCamera from "screens/SendCamera"
import SendPayRequest from "screens/SendPayRequest"
import TransactionDetail from "screens/TransactionDetail"
import TransactionList from "screens/TransactionList"
import LocationModel from "models/Location"

export type AppStackParamList = {
    Home: undefined
    ConnectorDetail: { location: LocationModel, evse: EvseModel, connector: ConnectorModel }
    Developer: undefined
    EvseList: { location: LocationModel, evses: EvseModel[], connector: ConnectorModel },
    ReceiveBitcoin: undefined
    ReceiveLightning: undefined
    ReceiveQr: { qrCode: string }
    SendCamera: undefined
    SendPayRequest: undefined
    TransactionList: undefined
    TransactionDetail: { identifier: string }
}

export type AppStackScreenParams = {
    Home: undefined
    ConnectorDetail: undefined
    Developer: undefined
    EvseList: undefined
    ReceiveBitcoin: undefined
    ReceiveLightning: undefined
    ReceiveQr: undefined
    SendCamera: undefined
    SendPayRequest: undefined
    TransactionList: undefined
    TransactionDetail: undefined
}

type AppStackParams = AppStackParamList | AppStackScreenParams

const AppStackNav = createNativeStackNavigator<AppStackParams>()

const screenOptions: NativeStackNavigationOptions = {
    headerShown: false
}

const AppStack = () => {
    const navigationWithHeaderOptions = useNavigationOptions({ headerShown: true })
    const navigationWithoutHeaderOptions = useNavigationOptions({ headerShown: false })

    return (
        <AppStackNav.Navigator initialRouteName={"Home"} screenOptions={screenOptions}>
            <AppStackNav.Screen name="Home" component={Home} options={navigationWithoutHeaderOptions} />
            <AppStackNav.Screen name="ConnectorDetail" component={ConnectorDetail} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="EvseList" component={EvseList} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="Developer" component={Developer} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="ReceiveBitcoin" component={ReceiveBitcoin} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="ReceiveLightning" component={ReceiveLightning} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="ReceiveQr" component={ReceiveQr} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="SendCamera" component={SendCamera} options={navigationWithoutHeaderOptions} />
            <AppStackNav.Screen name="SendPayRequest" component={SendPayRequest} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="TransactionList" component={TransactionList} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="TransactionDetail" component={TransactionDetail} options={navigationWithHeaderOptions} />
        </AppStackNav.Navigator>
    )
}

export default AppStack
