import BusyButton from "components/BusyButton"
import ConfirmationModal from "components/ConfirmationModal"
import HeaderBackButton from "components/HeaderBackButton"
import LocationHeader from "components/LocationHeader"
import StackedBar, { StackedBarItem, StackedBarItems } from "components/StackedBar"
import useColor from "hooks/useColor"
import useEnergySourceColors from "hooks/useEnergySourceColors"
import useNavigationOptions from "hooks/useNavigationOptions"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { hasEvseCapability } from "models/Evse"
import { Box, HStack, Text, useColorModeValue, useTheme, VStack } from "native-base"
import React, { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { BackHandler, StyleSheet, View } from "react-native"
import { RouteProp, StackActions, useFocusEffect } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { ChargeSessionStatus } from "types/chargeSession"
import { EvseCapability, EvseStatus } from "types/evse"
import { TokenType } from "types/token"
import { MINIMUM_REMOTE_CHARGE_BALANCE, MINIMUM_RFID_CHARGE_BALANCE } from "utils/constants"
import { errorToString } from "utils/conversion"
import I18n from "utils/i18n"
import styles from "utils/styles"
import PriceComponentTray from "components/PriceComponentTray"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faFlask } from "@fortawesome/free-solid-svg-icons"

const popAction = StackActions.pop()

const styleSheet = StyleSheet.create({
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
    const focusBackgroundColor = useColor(colors.dark[300], colors.warmGray[200])
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
    const { channelStore, sessionStore, settingStore } = useStore()

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

    const onBackPress = useCallback((): boolean => {
        navigation.dispatch(popAction)
        return true
    }, [navigation])

    const onPress = useCallback(async () => {
        setIsBusy(true)

        try {
            if (confirmationStatus === ChargeSessionStatus.STARTING) {
                const notificationsEnabled = await settingStore.requestPushNotificationPermission()

                if (notificationsEnabled) {
                    await sessionStore.startSession(location, evse, connector)
                }
            } else {
                await sessionStore.stopSession()
            }

            setIsConfirmationModalVisible(false)
        } catch (error) {
            setLastError(errorToString(error))
        }

        setIsBusy(false)
    }, [confirmationStatus])

    const renderError = useCallback(() => {
        return lastError.length > 0 ? (
            <Text textAlign="center" color={errorColor} fontSize={18} bold>
                {lastError}
            </Text>
        ) : (
            <></>
        )
    }, [lastError])

    const renderStop = useCallback(() => {
        if (lastError.length == 0 && isSessionConnector) {
            return sessionStore.tokenType === TokenType.OTHER ? (
                <BusyButton
                    isBusy={isBusy}
                    onPress={onShowStopConfirmation}
                    isDisabled={sessionStore.status === ChargeSessionStatus.IDLE || sessionStore.status === ChargeSessionStatus.STOPPING}
                    style={styles.focusViewButton}
                >
                    {I18n.t("Button_Stop")}
                </BusyButton>
            ) : (
                <Text style={styleSheet.nfcInfo} textAlign="center" color={textColor} fontSize={18} bold>
                    {I18n.t("ConnectorDetail_NfcStopText")}
                </Text>
            )
        }
    }, [lastError, isSessionConnector, isBusy, sessionStore.status])

    const renderStartInfo = useCallback(() => {
        return isRemoteCapable &&
            ((lastError.length == 0 && sessionStore.status === ChargeSessionStatus.IDLE) ||
                (isSessionConnector && sessionStore.status == ChargeSessionStatus.STARTING)) ? (
            <Text style={styleSheet.nfcInfo} textAlign="center" color={textColor} fontSize={16} bold>
                {I18n.t("ConnectorDetail_StartInfoText")}
            </Text>
        ) : (
            <></>
        )
    }, [lastError, isRemoteCapable, isSessionConnector, sessionStore.status])

    const renderStart = useCallback(() => {
        if (lastError.length == 0 && !isSessionConnector) {
            return isRemoteCapable ? (
                <BusyButton
                    isBusy={isBusy}
                    onPress={onShowStartConfirmation}
                    isDisabled={
                        channelStore.localBalance < MINIMUM_REMOTE_CHARGE_BALANCE ||
                        sessionStore.status !== ChargeSessionStatus.IDLE ||
                        evse.status !== EvseStatus.AVAILABLE
                    }
                    style={styles.focusViewButton}
                >
                    {I18n.t("Button_Start")}
                </BusyButton>
            ) : (
                <Text style={styleSheet.nfcInfo} textAlign="center" color={textColor} fontSize={18} bold>
                    {I18n.t("ConnectorDetail_NfcStartText")}
                </Text>
            )
        }
    }, [lastError, isSessionConnector, isBusy, channelStore.localBalance, sessionStore.status, evse.status])

    useFocusEffect(
        useCallback(() => {
            const backEventListener = BackHandler.addEventListener("hardwareBackPress", onBackPress)

            return () => backEventListener.remove()
        }, [navigation])
    )

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => <HeaderBackButton tintColor={navigationOptions.headerTintColor} onPress={onBackPress} />,
            title: I18n.t("ConnectorDetail_HeaderTitle")
        })
    }, [navigation])

    useEffect(() => {
        setIsSessionConnector(
            location.uid === sessionStore.location?.uid && evse.uid === sessionStore.evse?.uid && connector.uid === sessionStore.connector?.uid
        )
    }, [location, evse, connector, sessionStore.location, sessionStore.evse, sessionStore.connector])

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
        let lastError = ""

        if (!isSessionConnector) {
            if (evse.status !== EvseStatus.AVAILABLE) {
                lastError = I18n.t("ConnectorDetail_EvseStatusError", { status: I18n.t(evse.status).toLowerCase() })
            } else if (sessionStore.status === ChargeSessionStatus.AWAITING_PAYMENT) {
                lastError = I18n.t("ConnectorDetail_AwaitingPaymentError")
            } else if (sessionStore.status !== ChargeSessionStatus.IDLE) {
                lastError = I18n.t("ConnectorDetail_ChargeStatusError")
            } else if (isRemoteCapable && channelStore.localBalance < MINIMUM_REMOTE_CHARGE_BALANCE) {
                lastError = I18n.t("ConnectorDetail_LocalBalanceError", { satoshis: MINIMUM_REMOTE_CHARGE_BALANCE - channelStore.localBalance })
            } else if (!isRemoteCapable && channelStore.localBalance < MINIMUM_RFID_CHARGE_BALANCE) {
                lastError = I18n.t("ConnectorDetail_LocalBalanceError", { satoshis: MINIMUM_RFID_CHARGE_BALANCE - channelStore.localBalance })
            }
        }

        setLastError(lastError)
    }, [channelStore.localBalance, evse.status, isRemoteCapable, isSessionConnector, sessionStore.status])

    return (
        <View style={[styles.matchParent, { backgroundColor: focusBackgroundColor }]}>
            {location.isExperimental && (
                <Box bgColor="error.500" padding={2}>
                    <HStack width="100%">
                        <Text color="#ffffff" fontSize={14} fontWeight={600}>
                            {I18n.t("ConnectorDetail_ExperimentalText")}
                        </Text>
                    </HStack>
                </Box>
            )}
            <View style={[styles.focusViewPanel, { backgroundColor, paddingHorizontal: 10 }]}>
                <LocationHeader location={route.params.location} />
                <PriceComponentTray marginTop={2} connector={connector} />
                <VStack space={3} marginTop={5}>
                    {energySources.length > 0 && <StackedBar items={energySources} />}
                    {renderStartInfo()}
                    {renderStart()}
                    {renderStop()}
                    {renderError()}
                </VStack>
            </View>
            <View style={styles.focusViewBackground}>
                <VStack>
                    <Text color={textColor} fontSize={12}>
                        * {I18n.t("ConnectorDetail_PriceDisclaimerText")}
                    </Text>
                    <Text paddingTop={5} color={textColor} fontSize={12}>
                        {I18n.t("ConnectorDetail_OperatorInfoText")}
                    </Text>
                    <Text paddingTop={5} color={textColor} fontSize={12}>
                        {I18n.t("ConnectorDetail_LocationText", { name: location.name })}
                    </Text>
                    <Text color={textColor} fontSize={12}>
                        {I18n.t("ConnectorDetail_EvseIdentityText", { evseId: evse.evseId || evse.identifier || evse.uid })}
                    </Text>
                </VStack>
            </View>
            <ConfirmationModal
                isVisible={isConfirmationModalVisible}
                text={confirmationModalText}
                buttonText={confirmationButtonText}
                onClose={() => setIsConfirmationModalVisible(false)}
                onPress={onPress}
            />
        </View>
    )
}

export default observer(ConnectorDetail)
