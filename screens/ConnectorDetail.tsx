import BusyButton from "components/BusyButton"
import ConfirmationModal from "components/ConfirmationModal"
import HeaderBackButton from "components/HeaderBackButton"
import LocationHeader from "components/LocationHeader"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { hasEvseCapability } from "models/Evse"
import { Text, useColorModeValue, useTheme, VStack } from "native-base"
import React, { useEffect, useLayoutEffect, useState } from "react"
import { StyleSheet, View } from "react-native"
import { RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import I18n from "utils/i18n"
import styles from "utils/styles"
import { errorToString } from "utils/conversion"
import { ChargeSessionStatus } from "types/chargeSession"
import { EvseCapability, EvseStatus } from "types/evse"
import { MINIMUM_REMOTE_CHARGE_BALANCE, MINIMUM_RFID_CHARGE_BALANCE } from "utils/constants"
import StackedBar, { StackedBarItem, StackedBarItems } from "components/StackedBar"
import useEnergySourceColors from "hooks/useEnergySourceColors"
import { TokenType } from "types/token"

const styleSheet = StyleSheet.create({
    connectorInfo: {
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingBottom: 30
    },
    nfcInfo: {
        paddingVertical: 20
    }
})

type ConnectorDetailProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "ConnectorDetail">
    route: RouteProp<AppStackParamList, "ConnectorDetail">
}

const ConnectorDetail = ({ navigation, route }: ConnectorDetailProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const operatorBackgroundColor = useColor(colors.dark[300], colors.warmGray[200])
    const errorColor = useColorModeValue("error.300", "error.500")
    const textColor = useColorModeValue("lightText", "darkText")
    const energySourceColors = useEnergySourceColors()
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const [location] = useState(route.params.location)
    const [evse] = useState(route.params.evse)
    const [connector] = useState(route.params.connector)
    const [isBusy, setIsBusy] = useState(false)
    const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false)
    const [isRemoteCapable] = useState(hasEvseCapability(evse.capabilities, EvseCapability.REMOTE_START_STOP_CAPABLE))
    const [isSessionConnector, setIsSessionConnector] = useState(false)
    const [confirmationModalText, setConfirmationModalText] = useState("")
    const [confirmationButtonText, setConfirmationButtonText] = useState("")
    const [confirmationStatus, setConfirmationStatus] = useState(ChargeSessionStatus.IDLE)
    const [lastError, setLastError] = useState("")
    const [energySources, setEnergySources] = useState<StackedBarItems>([])
    const { channelStore, sessionStore, uiStore } = useStore()

    const onClose = () => {
        uiStore.clearChargePoint()
        navigation.navigate("Home")
    }

    const onShowStartConfirmation = () => {
        setConfirmationModalText(I18n.t("ConfirmationModal_StartConfirmationText"))
        setConfirmationButtonText(I18n.t("Button_Start"))
        setConfirmationStatus(ChargeSessionStatus.STARTING)
        setIsConfirmationModalVisible(true)
    }

    const onShowStopConfirmation = () => {
        setConfirmationModalText(I18n.t("ConfirmationModal_StopConfirmationText"))
        setConfirmationButtonText(I18n.t("Button_Stop"))
        setConfirmationStatus(ChargeSessionStatus.STOPPING)
        setIsConfirmationModalVisible(true)
    }

    const onPress = async () => {
        setIsBusy(true)

        try {
            if (confirmationStatus === ChargeSessionStatus.STARTING) {
                await sessionStore.startSession(location, evse, connector)
            } else {
                await sessionStore.stopSession()
            }

            setIsConfirmationModalVisible(false)
        } catch (error) {
            setLastError(errorToString(error))
        }

        setIsBusy(false)
    }

    const renderError = () => {
        return lastError.length > 0 ? (
            <Text textAlign="center" color={errorColor} fontSize={18} bold>
                {lastError}
            </Text>
        ) : (
            <></>
        )
    }

    const renderStop = () => {
        if (lastError.length == 0 && isSessionConnector) {
            return sessionStore.tokenType === TokenType.OTHER ? (
                <BusyButton
                    isBusy={isBusy}
                    marginTop={5}
                    onPress={onShowStopConfirmation}
                    isDisabled={sessionStore.status === ChargeSessionStatus.IDLE || sessionStore.status === ChargeSessionStatus.STOPPING}
                >
                    {I18n.t("Button_Stop")}
                </BusyButton>
            ) : (
                <Text style={styleSheet.nfcInfo} textAlign="center" color={textColor} fontSize={18} bold>
                    {I18n.t("ConnectorDetail_NfcStopText")}
                </Text>
            )
        }
    }

    const renderStartInfo = () => {
        return (lastError.length == 0 && sessionStore.status === ChargeSessionStatus.IDLE) || sessionStore.status == ChargeSessionStatus.STARTING ? (
            <Text style={styleSheet.nfcInfo} textAlign="center" color={textColor} fontSize={16} bold>
                {I18n.t("ConnectorDetail_StartInfoText")}
            </Text>
        ) : (
            <></>
        )
    }

    const renderStart = () => {
        if (lastError.length == 0 && !isSessionConnector) {
            return isRemoteCapable ? (
                <BusyButton
                    isBusy={isBusy}
                    marginTop={5}
                    onPress={onShowStartConfirmation}
                    isDisabled={
                        channelStore.localBalance < MINIMUM_REMOTE_CHARGE_BALANCE ||
                        sessionStore.status !== ChargeSessionStatus.IDLE ||
                        evse.status !== EvseStatus.AVAILABLE
                    }
                >
                    {I18n.t("Button_Start")}
                </BusyButton>
            ) : (
                <Text style={styleSheet.nfcInfo} textAlign="center" color={textColor} fontSize={18} bold>
                    {I18n.t("ConnectorDetail_NfcStartText")}
                </Text>
            )
        }
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => <HeaderBackButton tintColor={navigationOptions.headerTintColor} onPress={onClose} />,
            title: I18n.t("ConnectorDetail_HeaderTitle")
        })
    }, [navigation])

    useEffect(() => {
        setIsSessionConnector(
            !!sessionStore.location &&
                !!sessionStore.evse &&
                !!sessionStore.connector &&
                location.uid === sessionStore.location.uid &&
                evse.uid === sessionStore.evse.uid &&
                connector.uid === sessionStore.connector.uid
        )
    }, [sessionStore.location, sessionStore.evse, sessionStore.connector])

    useEffect(() => {
        let energySources: StackedBarItems = []

        if (connector.tariff?.energyMix) {
            energySources = connector.tariff.energyMix.energySources.map(
                ({ source, percentage }) =>
                    ({
                        color: energySourceColors[source],
                        label: I18n.t(source) + ` (${percentage}%)`,
                        percent: percentage
                    } as StackedBarItem)
            )
        }

        setEnergySources(energySources)
    }, [connector.tariff])

    useEffect(() => {
        if (!isSessionConnector) {
            if (evse.status !== EvseStatus.AVAILABLE) {
                setLastError(I18n.t("ConnectorDetail_EvseStatusError", { status: I18n.t(evse.status).toLowerCase() }))
            } else if (sessionStore.status !== ChargeSessionStatus.IDLE) {
                setLastError(I18n.t("ConnectorDetail_ChargeStatusError"))
            } else if (isRemoteCapable && channelStore.localBalance < MINIMUM_REMOTE_CHARGE_BALANCE) {
                setLastError(I18n.t("ConnectorDetail_LocalBalanceError", { satoshis: MINIMUM_REMOTE_CHARGE_BALANCE - channelStore.localBalance }))
            } else if (!isRemoteCapable && channelStore.localBalance < MINIMUM_RFID_CHARGE_BALANCE) {
                setLastError(I18n.t("ConnectorDetail_LocalBalanceError", { satoshis: MINIMUM_RFID_CHARGE_BALANCE - channelStore.localBalance }))
            }
        }
    }, [])

    return (
        <View style={[styles.matchParent, { backgroundColor: operatorBackgroundColor }]}>
            <View style={[styleSheet.connectorInfo, { backgroundColor, padding: 10 }]}>
                <LocationHeader location={route.params.location} />
                <VStack space={5} marginTop={10}>
                    {energySources.length > 0 && <StackedBar items={energySources} />}
                    {renderStartInfo()}
                    {renderStart()}
                    {renderStop()}
                    {renderError()}
                </VStack>
                <ConfirmationModal
                    isVisible={isConfirmationModalVisible}
                    text={confirmationModalText}
                    buttonText={confirmationButtonText}
                    onClose={() => setIsConfirmationModalVisible(false)}
                    onPress={onPress}
                />
            </View>
            <View style={{ padding: 20 }}>
                <VStack>
                    <Text color={textColor} fontSize={12}>
                        {I18n.t("ConnectorDetail_OperatorInfoText")}
                    </Text>
                    <Text paddingTop={5} color={textColor} fontSize={12}>
                        {I18n.t("ConnectorDetail_EvseIdentityText", { evseId: evse.identifier || evse.uid })}
                    </Text>
                    <Text color={textColor} fontSize={12}>
                        {I18n.t("ConnectorDetail_ConnectorIdentityText", { connectorId: connector.identifier || connector.uid })}
                    </Text>
                </VStack>
            </View>
        </View>
    )
}

export default observer(ConnectorDetail)
