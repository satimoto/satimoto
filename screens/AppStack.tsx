import useNavigationOptions from "hooks/useNavigationOptions"
import { useStore } from "hooks/useStore"
import I18n from "i18n-js"
import { observer } from "mobx-react"
import ConnectorModel, { ConnectorGroup } from "models/Connector"
import EvseModel from "models/Evse"
import ChannelModel from "models/Channel"
import LocationModel from "models/Location"
import InvoiceModel from "models/Invoice"
import SessionModel from "models/Session"
import { useToast } from "native-base"
import React, { useEffect } from "react"
import { Linking } from "react-native"
import * as breezSdk from "@breeztech/react-native-breez-sdk"
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
import PdfViewer from "screens/PdfViewer"
import Scanner from "screens/Scanner"
import Settings from "screens/Settings"
import SettingsAdvanced from "screens/SettingsAdvanced"
import SettingsBackend from "screens/SettingsBackend"
import SettingsBackends from "screens/SettingsBackends"
import SettingsBattery from "screens/SettingsBattery"
import SettingsChannel from "screens/SettingsChannel"
import SettingsChannels from "screens/SettingsChannels"
import SettingsCharging from "screens/SettingsCharging"
import SettingsFiatCurrencies from "screens/SettingsFiatCurrencies"
import SettingsBackupMnemonic from "screens/SettingsBackupMnemonic"
import SettingsImportMnemonic from "screens/SettingsImportMnemonic"
import SettingsLearn from "screens/SettingsLearn"
import SettingsOnChain from "screens/SettingsOnChain"
import SettingsPayments from "screens/SettingsPayments"
import SettingsSendReport from "screens/SettingsSendReport"
import SettingsSession from "screens/SettingsSession"
import SettingsSessions from "screens/SettingsSessions"
import SettingsTokens from "screens/SettingsTokens"
import WaitForPayment from "screens/WaitForPayment"
import Welcome from "screens/Welcome"
import { ChannelRequestStatus } from "types/channelRequest"
import { LinkingEvent } from "types/linking"
import { Log } from "utils/logging"
import { Source } from "react-native-pdf"
import { LightningBackend } from "types/lightningBackend"

const log = new Log("AppStack")

export type AppStackParamList = {
    ChargeDetail: undefined
    ConnectorDetail: { location: LocationModel; evse: EvseModel; connector: ConnectorModel }
    Developer: undefined
    EvseList: { location: LocationModel; evses: EvseModel[]; connectorGroup: ConnectorGroup }
    Home: undefined
    LnUrlPay: { payParams: breezSdk.LnUrlPayRequestData }
    LnUrlWithdraw: { withdrawParams: breezSdk.LnUrlWithdrawRequestData }
    PaymentRequest: { payReq: string; lnInvoice: breezSdk.LnInvoice }
    PdfViewer: { downloadPath?: string; source: Source; title?: string }
    Scanner: undefined
    Settings: undefined
    SettingsAdvanced: undefined
    SettingsBackend: { backend: LightningBackend }
    SettingsBackends: undefined
    SettingsBattery: undefined
    SettingsChannel: { channel: ChannelModel }
    SettingsChannels: undefined
    SettingsCharging: undefined
    SettingsFiatCurrencies: undefined
    SettingsBackupMnemonic: { backend: LightningBackend }
    SettingsImportMnemonic: { backend: LightningBackend }
    SettingsLearn: undefined
    SettingsOnChain: undefined
    SettingsPayments: undefined
    SettingsSendReport: undefined
    SettingsSession: { session: SessionModel }
    SettingsSessions: undefined
    SettingsTokens: undefined
    WaitForPayment: { invoice: InvoiceModel }
    Welcome: undefined
}

export type AppStackScreenParams = {
    ChargeDetail: undefined
    ConnectorDetail: undefined
    Developer: undefined
    EvseList: undefined
    Home: undefined
    LnUrlPay: undefined
    LnUrlWithdraw: undefined
    PaymentRequest: undefined
    PdfViewer: undefined
    Scanner: undefined
    Settings: undefined
    SettingsAdvanced: undefined
    SettingsBackend: undefined
    SettingsBackends: undefined
    SettingsBattery: undefined
    SettingsChannel: undefined
    SettingsChannels: undefined
    SettingsCharging: undefined
    SettingsFiatCurrencies: undefined
    SettingsBackupMnemonic: undefined
    SettingsImportMnemonic: undefined
    SettingsLearn: undefined
    SettingsOnChain: undefined
    SettingsPayments: undefined
    SettingsSendReport: undefined
    SettingsSession: undefined
    SettingsSessions: undefined
    SettingsTokens: undefined
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
        log.debug(`SAT005 onLinkingUrl: ${url}`, true)
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
        if (uiStore.paymentRequest && uiStore.lnInvoice) {
            navigation.navigate("PaymentRequest", { payReq: uiStore.paymentRequest, lnInvoice: uiStore.lnInvoice })
        }
    }, [uiStore.lnInvoice, uiStore.paymentRequest])

    return uiStore.hydrated ? (
        <AppStackNav.Navigator initialRouteName={uiStore.hasOnboardingUpdates ? "Welcome" : "Home"} screenOptions={screenOptions}>
            <AppStackNav.Screen name="ChargeDetail" component={ChargeDetail} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="ConnectorDetail" component={ConnectorDetail} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="Home" component={Home} options={navigationWithoutHeaderOptions} />
            <AppStackNav.Screen name="EvseList" component={EvseList} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="Developer" component={Developer} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="LnUrlPay" component={LnUrlPay} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="LnUrlWithdraw" component={LnUrlWithdraw} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="PaymentRequest" component={PaymentRequest} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="PdfViewer" component={PdfViewer} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="Scanner" component={Scanner} options={navigationWithoutHeaderOptions} />
            <AppStackNav.Screen name="Settings" component={Settings} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="SettingsAdvanced" component={SettingsAdvanced} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="SettingsBackend" component={SettingsBackend} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="SettingsBackends" component={SettingsBackends} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="SettingsBattery" component={SettingsBattery} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="SettingsChannel" component={SettingsChannel} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="SettingsChannels" component={SettingsChannels} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="SettingsCharging" component={SettingsCharging} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="SettingsFiatCurrencies" component={SettingsFiatCurrencies} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="SettingsBackupMnemonic" component={SettingsBackupMnemonic} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="SettingsImportMnemonic" component={SettingsImportMnemonic} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="SettingsLearn" component={SettingsLearn} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="SettingsOnChain" component={SettingsOnChain} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="SettingsPayments" component={SettingsPayments} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="SettingsSendReport" component={SettingsSendReport} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="SettingsSession" component={SettingsSession} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="SettingsSessions" component={SettingsSessions} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="SettingsTokens" component={SettingsTokens} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="WaitForPayment" component={WaitForPayment} options={navigationWithHeaderOptions} />
            <AppStackNav.Screen name="Welcome" component={Welcome} options={navigationWithoutHeaderOptions} />
        </AppStackNav.Navigator>
    ) : (
        <></>
    )
}

export default observer(AppStack)
