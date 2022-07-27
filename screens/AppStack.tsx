import useNavigationOptions from "hooks/useNavigationOptions"
import ConnectorModel from "models/Connector"
import EvseModel from "models/Evse"
import { createNativeStackNavigator, NativeStackNavigationOptions, NativeStackNavigationProp } from "@react-navigation/native-stack"
import React, { useEffect } from "react"
import Camera from "screens/Camera"
import ChargeDetail from "screens/ChargeDetail"
import ConnectorDetail from "screens/ConnectorDetail"
import Developer from "screens/Developer"
import EvseList from "screens/EvseList"
import Home, { HomeNavigationProp } from "screens/Home"
import LnUrlPay from "screens/LnUrlPay"
import LnUrlWithdraw from "screens/LnUrlWithdraw"
import TransactionDetail from "screens/TransactionDetail"
import TransactionList from "screens/TransactionList"
import WaitForPayment from "screens/WaitForPayment"
import LocationModel from "models/Location"
import InvoiceModel from "models/Invoice"
import { useStore } from "hooks/useStore"
import { useNavigation } from "@react-navigation/native"
import { observer } from "mobx-react"

export type AppStackParamList = {
    Home: undefined
    Camera: undefined
    ChargeDetail: undefined
    ConnectorDetail: { location: LocationModel, evse: EvseModel, connector: ConnectorModel }
    Developer: undefined
    EvseList: { location: LocationModel, evses: EvseModel[], connector: ConnectorModel },
    LnUrlPay: undefined
    LnUrlWithdraw: undefined
    TransactionList: undefined
    TransactionDetail: { identifier: string }
    WaitForPayment: { invoice: InvoiceModel }
}

export type AppStackScreenParams = {
    Home: undefined
    Camera: undefined
    ChargeDetail: undefined
    ConnectorDetail: undefined
    Developer: undefined
    EvseList: undefined
    LnUrlPay: undefined
    LnUrlWithdraw: undefined
    TransactionList: undefined
    TransactionDetail: undefined
    WaitForPayment: undefined
}

type AppStackParams = AppStackParamList | AppStackScreenParams

const AppStackNav = createNativeStackNavigator<AppStackParams>()

const screenOptions: NativeStackNavigationOptions = {
    headerShown: false
}

const AppStack = () => {
    const navigationWithHeaderOptions = useNavigationOptions({ headerShown: true })
    const navigationWithoutHeaderOptions = useNavigationOptions({ headerShown: false })
    const navigation = useNavigation<HomeNavigationProp>()
    const { uiStore } = useStore()

    useEffect(() => {
        if (uiStore.lnUrlPayParams) {
            navigation.navigate("LnUrlPay")
        }
    }, [uiStore.lnUrlPayParams])

    useEffect(() => {
        if (uiStore.lnUrlWithdrawParams) {
            navigation.navigate("LnUrlWithdraw")
        }
    }, [uiStore.lnUrlWithdrawParams])

    return (
        <AppStackNav.Navigator initialRouteName={"Home"} screenOptions={screenOptions}>
            <AppStackNav.Screen name="Camera" component={Camera} options={navigationWithoutHeaderOptions} />
            <AppStackNav.Screen name="ChargeDetail" component={ChargeDetail} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="ConnectorDetail" component={ConnectorDetail} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="Home" component={Home} options={navigationWithoutHeaderOptions} />
            <AppStackNav.Screen name="EvseList" component={EvseList} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="Developer" component={Developer} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="LnUrlPay" component={LnUrlPay} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="LnUrlWithdraw" component={LnUrlWithdraw} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="TransactionList" component={TransactionList} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="TransactionDetail" component={TransactionDetail} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="WaitForPayment" component={WaitForPayment} options={navigationWithHeaderOptions} />
        </AppStackNav.Navigator>
    )
}

export default observer(AppStack)
