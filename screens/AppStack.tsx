import useNavigationOptions from "hooks/useNavigationOptions"
import { useStore } from "hooks/useStore"
import { LNURLPayParams, LNURLWithdrawParams } from "js-lnurl"
import { observer } from "mobx-react"
import ConnectorModel from "models/Connector"
import EvseModel from "models/Evse"
import LocationModel from "models/Location"
import InvoiceModel from "models/Invoice"
import { lnrpc } from "proto/proto"
import React, { useEffect } from "react"
import { AppState, AppStateStatus, Linking } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { createNativeStackNavigator, NativeStackNavigationOptions } from "@react-navigation/native-stack"
import ChargeDetail from "screens/ChargeDetail"
import ConnectorDetail from "screens/ConnectorDetail"
import Developer from "screens/Developer"
import EvseList from "screens/EvseList"
import Home, { HomeNavigationProp } from "screens/Home"
import LnUrlPay from "screens/LnUrlPay"
import LnUrlWithdraw from "screens/LnUrlWithdraw"
import PaymentRequest from "screens/PaymentRequest"
import Scanner from "screens/Scanner"
import TransactionDetail from "screens/TransactionDetail"
import TransactionList from "screens/TransactionList"
import WaitForPayment from "screens/WaitForPayment"
import { LinkingEvent } from "types/linking"
import { Log } from "utils/logging"

const log = new Log("AppStack")

export type AppStackParamList = {
    Home: undefined
    ChargeDetail: undefined
    ConnectorDetail: { location: LocationModel, evse: EvseModel, connector: ConnectorModel }
    Developer: undefined
    EvseList: { location: LocationModel, evses: EvseModel[], connector: ConnectorModel },
    LnUrlPay: {payParams: LNURLPayParams}
    LnUrlWithdraw: {withdrawParams: LNURLWithdrawParams}
    PaymentRequest: {payReq: string, decodedPayReq: lnrpc.PayReq}
    Scanner: undefined
    TransactionList: undefined
    TransactionDetail: { identifier: string }
    WaitForPayment: { invoice: InvoiceModel }
}

export type AppStackScreenParams = {
    Home: undefined
    ChargeDetail: undefined
    ConnectorDetail: undefined
    Developer: undefined
    EvseList: undefined
    LnUrlPay: undefined
    LnUrlWithdraw: undefined
    PaymentRequest: undefined
    Scanner: undefined
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

    const onAppStateChange = (state: AppStateStatus) => {
        log.debug(`onAppStateChange: ${state}`)
    }

    const onLinkingUrl = ({ url }: LinkingEvent) => {
        log.debug(`onLinkingUrl: ${url}`)
        uiStore.parseIntent(url)
    }

    useEffect(() => {
        AppState.addEventListener("change", onAppStateChange)
        Linking.addEventListener("url", onLinkingUrl)

        return () => {
            AppState.removeEventListener("change", onAppStateChange)
            Linking.removeEventListener("url", onLinkingUrl)
        }
    }, [])

    useEffect(() => {
        if (uiStore.lnUrlPayParams) {
            navigation.navigate("LnUrlPay", {payParams: uiStore.lnUrlPayParams})
        }
    }, [uiStore.lnUrlPayParams])

    useEffect(() => {
        if (uiStore.lnUrlWithdrawParams) {
            navigation.navigate("LnUrlWithdraw", {withdrawParams: uiStore.lnUrlWithdrawParams})
        }
    }, [uiStore.lnUrlWithdrawParams])

    useEffect(() => {
        if (uiStore.paymentRequest && uiStore.decodedPaymentRequest) {
            navigation.navigate("PaymentRequest", {payReq: uiStore.paymentRequest, decodedPayReq: uiStore.decodedPaymentRequest})
        }
    }, [uiStore.decodedPaymentRequest, uiStore.paymentRequest])

    return (
        <AppStackNav.Navigator initialRouteName={"Home"} screenOptions={screenOptions}>
            <AppStackNav.Screen name="ChargeDetail" component={ChargeDetail} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="ConnectorDetail" component={ConnectorDetail} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="Home" component={Home} options={navigationWithoutHeaderOptions} />
            <AppStackNav.Screen name="EvseList" component={EvseList} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="Developer" component={Developer} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="LnUrlPay" component={LnUrlPay} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="LnUrlWithdraw" component={LnUrlWithdraw} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="PaymentRequest" component={PaymentRequest} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="Scanner" component={Scanner} options={navigationWithoutHeaderOptions} />
            <AppStackNav.Screen name="TransactionList" component={TransactionList} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="TransactionDetail" component={TransactionDetail} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="WaitForPayment" component={WaitForPayment} options={navigationWithHeaderOptions} />
        </AppStackNav.Navigator>
    )
}

export default observer(AppStack)
