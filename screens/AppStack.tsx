import useNavigationOptions from "hooks/useNavigationOptions"
import { useStore } from "hooks/useStore"
import I18n from "i18n-js"
import { LNURLPayParams, LNURLWithdrawParams } from "js-lnurl"
import { observer } from "mobx-react"
import ConnectorModel, { ConnectorGroup } from "models/Connector"
import EvseModel from "models/Evse"
import ChannelModel from "models/Channel"
import LocationModel from "models/Location"
import InvoiceModel from "models/Invoice"
import { useToast } from "native-base"
import React, { useEffect } from "react"
import { Linking } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { createNativeStackNavigator, NativeStackNavigationOptions } from "@react-navigation/native-stack"
import Advanced from "screens/Advanced"
import ChannelDetail from "screens/ChannelDetail"
import ChannelList from "screens/ChannelList"
import ChargeDetail from "screens/ChargeDetail"
import ConnectorDetail from "screens/ConnectorDetail"
import Developer from "screens/Developer"
import EvseList from "screens/EvseList"
import Home, { HomeNavigationProp } from "screens/Home"
import LnUrlPay from "screens/LnUrlPay"
import LnUrlWithdraw from "screens/LnUrlWithdraw"
import PaymentRequest from "screens/PaymentRequest"
import Scanner from "screens/Scanner"
import Settings from "screens/Settings"
import TokenList from "screens/TokenList"
import TransactionList from "screens/TransactionList"
import WaitForPayment from "screens/WaitForPayment"
import Welcome from "screens/Welcome"
import { ChannelRequestStatus } from "types/channelRequest"
import { LinkingEvent } from "types/linking"
import { PayReq } from "types/payment"
import { Log } from "utils/logging"

const log = new Log("AppStack")

export type AppStackParamList = {
    Advanced: undefined
    ChannelDetail: { channel: ChannelModel }
    ChannelList: undefined
    ChargeDetail: undefined
    ConnectorDetail: { location: LocationModel; evse: EvseModel; connector: ConnectorModel }
    Developer: undefined
    EvseList: { location: LocationModel; evses: EvseModel[]; connectorGroup: ConnectorGroup }
    Home: undefined
    LnUrlPay: { payParams: LNURLPayParams }
    LnUrlWithdraw: { withdrawParams: LNURLWithdrawParams }
    PaymentRequest: { payReq: string; decodedPayReq: PayReq }
    Scanner: undefined
    Settings: undefined
    TokenList: undefined
    TransactionList: undefined
    WaitForPayment: { invoice: InvoiceModel }
    Welcome: undefined
}

export type AppStackScreenParams = {
    Advanced: undefined
    ChannelDetail: undefined
    ChannelList: undefined
    ChargeDetail: undefined
    ConnectorDetail: undefined
    Developer: undefined
    EvseList: undefined
    Home: undefined
    LnUrlPay: undefined
    LnUrlWithdraw: undefined
    PaymentRequest: undefined
    Scanner: undefined
    Settings: undefined
    TokenList: undefined
    TransactionList: undefined
    WaitForPayment: undefined
    Welcome: undefined
}

const AppStackNav = createNativeStackNavigator<AppStackParamList>()

const screenOptions: NativeStackNavigationOptions = {
    headerShown: false
}

const AppStack = () => {
    const navigationWithHeaderOptions = useNavigationOptions({ headerShown: true })
    const navigationWithoutHeaderOptions = useNavigationOptions({ headerShown: false })
    const navigation = useNavigation<HomeNavigationProp>()
    const { channelStore, uiStore } = useStore()
    const toast = useToast()

    const onLinkingUrl = ({ url }: LinkingEvent) => {
        log.debug(`onLinkingUrl: ${url}`)
        uiStore.parseIntent(url)
    }

    useEffect(() => {
        const linkingListener = Linking.addEventListener("url", onLinkingUrl)

        return () => {
            linkingListener.remove()
        }
    }, [])

    useEffect(() => {
        if (channelStore.channelRequestStatus === ChannelRequestStatus.NEGOTIATING) {
            toast.show({
                title: I18n.t("WaitForPayment_ChannelRequestNegotiatingText"),
                placement: "top"
            })
        } else if (channelStore.channelRequestStatus === ChannelRequestStatus.OPENED) {
            toast.show({
                title: I18n.t("WaitForPayment_ChannelRequestOpenedText"),
                placement: "top"
            })
        }
    }, [channelStore.channelRequestStatus])

    useEffect(() => {
        if (uiStore.connector && uiStore.evse && uiStore.location) {
            navigation.navigate("ConnectorDetail", { connector: uiStore.connector, evse: uiStore.evse, location: uiStore.location })
        }
    }, [uiStore.connector, uiStore.evse, uiStore.location])

    useEffect(() => {
        if (uiStore.lnUrlPayParams) {
            navigation.navigate("LnUrlPay", { payParams: uiStore.lnUrlPayParams })
        }
    }, [uiStore.lnUrlPayParams])

    useEffect(() => {
        if (uiStore.lnUrlWithdrawParams) {
            navigation.navigate("LnUrlWithdraw", { withdrawParams: uiStore.lnUrlWithdrawParams })
        }
    }, [uiStore.lnUrlWithdrawParams])

    useEffect(() => {
        if (uiStore.paymentRequest && uiStore.decodedPaymentRequest) {
            navigation.navigate("PaymentRequest", { payReq: uiStore.paymentRequest, decodedPayReq: uiStore.decodedPaymentRequest })
        }
    }, [uiStore.decodedPaymentRequest, uiStore.paymentRequest])

    return uiStore.hydrated ? (
        <AppStackNav.Navigator initialRouteName={uiStore.hasOnboardingUpdates ? "Welcome" : "Home"} screenOptions={screenOptions}>
            <AppStackNav.Screen name="Advanced" component={Advanced} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="ChannelDetail" component={ChannelDetail} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="ChannelList" component={ChannelList} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="ChargeDetail" component={ChargeDetail} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="ConnectorDetail" component={ConnectorDetail} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="Home" component={Home} options={navigationWithoutHeaderOptions} />
            <AppStackNav.Screen name="EvseList" component={EvseList} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="Developer" component={Developer} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="LnUrlPay" component={LnUrlPay} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="LnUrlWithdraw" component={LnUrlWithdraw} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="PaymentRequest" component={PaymentRequest} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="Scanner" component={Scanner} options={navigationWithoutHeaderOptions} />
            <AppStackNav.Screen name="Settings" component={Settings} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="TokenList" component={TokenList} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="TransactionList" component={TransactionList} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="WaitForPayment" component={WaitForPayment} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="Welcome" component={Welcome} options={navigationWithoutHeaderOptions} />
        </AppStackNav.Navigator>
    ) : (
        <></>
    )
}

export default observer(AppStack)
