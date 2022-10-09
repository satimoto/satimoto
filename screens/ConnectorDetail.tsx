import BusyButton from "components/BusyButton"
import ConfirmationModal from "components/ConfirmationModal"
import HeaderBackButton from "components/HeaderBackButton"
import LocationHeader from "components/LocationHeader"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { Text, useColorModeValue, useTheme, VStack } from "native-base"
import React, { useEffect, useLayoutEffect, useState } from "react"
import { View } from "react-native"
import { RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import I18n from "utils/i18n"
import styles from "utils/styles"
import { errorToString } from "utils/conversion"
import { ChargeSessionStatus } from "types/chargeSession"
import { EvseStatus } from "types/evse"
import { MINIMUM_CHARGE_BALANCE } from "utils/constants"
import StackedBar, { StackedBarItem, StackedBarItems } from "components/StackedBar"
import useEnergySourceColors from "hooks/useEnergySourceColors"

type ConnectorDetailProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "ConnectorDetail">
    route: RouteProp<AppStackParamList, "ConnectorDetail">
}

const ConnectorDetail = ({ navigation, route }: ConnectorDetailProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const errorColor = useColorModeValue("error.300", "error.500")
    const energySourceColors = useEnergySourceColors()
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const [isBusy, setIsBusy] = useState(false)
    const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false)
    const [isSessionConnector, setIsSessionConnector] = useState(false)
    const [confirmationModalText, setConfirmationModalText] = useState("")
    const [confirmationButtonText, setConfirmationButtonText] = useState("")
    const [confirmationStatus, setConfirmationStatus] = useState(ChargeSessionStatus.IDLE)
    const [lastError, setLastError] = useState("")
    const [location] = useState(route.params.location)
    const [evse] = useState(route.params.evse)
    const [connector] = useState(route.params.connector)
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

    const renderStopButton = () => {
        return (
            isSessionConnector && (
                <BusyButton
                    isBusy={isBusy}
                    marginTop={5}
                    onPress={onShowStopConfirmation}
                    isDisabled={sessionStore.status === ChargeSessionStatus.IDLE || sessionStore.status === ChargeSessionStatus.STOPPING}
                >
                    {I18n.t("Button_Stop")}
                </BusyButton>
            )
        )
    }

    const renderStartButton = () => {
        return (
            !isSessionConnector && (
                <BusyButton
                    isBusy={isBusy}
                    marginTop={5}
                    onPress={onShowStartConfirmation}
                    isDisabled={
                        channelStore.localBalance < MINIMUM_CHARGE_BALANCE ||
                        sessionStore.status !== ChargeSessionStatus.IDLE ||
                        evse.status !== EvseStatus.AVAILABLE
                    }
                >
                    {I18n.t("Button_Start")}
                </BusyButton>
            )
        )
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <HeaderBackButton
                    tintColor={navigationOptions.headerTintColor}
                    onPress={onClose}
                />
            ),
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
            } else if (channelStore.localBalance < MINIMUM_CHARGE_BALANCE) {
                setLastError(I18n.t("ConnectorDetail_LocalBalanceError", { satoshis: MINIMUM_CHARGE_BALANCE - channelStore.localBalance }))
            }
        }
    }, [])

    return (
        <View style={[styles.matchParent, { backgroundColor, padding: 10 }]}>
            <LocationHeader location={route.params.location} />
            <VStack space={2}>
                {energySources.length > 0 && <StackedBar items={energySources} />}
                {renderStopButton()}
                {renderStartButton()}
                {lastError.length > 0 && <Text color={errorColor}>{lastError}</Text>}
            </VStack>
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
