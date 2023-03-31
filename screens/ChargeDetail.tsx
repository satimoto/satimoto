import AddressCard from "components/AddressCard"
import BusyButton from "components/BusyButton"
import ChargeInfo from "components/ChargeInfo"
import ConfirmationModal from "components/ConfirmationModal"
import PaymentButton from "components/PaymentButton"
import PaymentInfoModal from "components/PaymentInfoModal"
import SatoshiBalance from "components/SatoshiBalance"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faStop } from "@fortawesome/free-solid-svg-icons"
import useColor from "hooks/useColor"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import PaymentModel from "models/Payment"
import { IconButton, Text, useTheme, VStack } from "native-base"
import React, { useCallback, useLayoutEffect, useState } from "react"
import { ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { ChargeSessionStatus } from "types/chargeSession"
import { TokenType } from "types/token"
import I18n from "utils/i18n"
import styles from "utils/styles"

type ChargeDetailProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "ChargeDetail">
}

const ChargeDetail = ({ navigation }: ChargeDetailProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const textColor = useColor(colors.lightText, colors.darkText)
    const safeAreaInsets = useSafeAreaInsets()
    const [isConfirmChargeBusy, setConfirmChargeIsBusy] = useState(false)
    const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false)
    const [shownPayment, setShownPayment] = useState<PaymentModel>()
    const { sessionStore } = useStore()

    const onConfirmChargePress = useCallback(async () => {
        setConfirmChargeIsBusy(true)

        try {
            await sessionStore.confirmSession()
        } catch (error) {}

        setConfirmChargeIsBusy(false)
    }, [])

    const onPaymentPress = (payment: PaymentModel) => {
        setShownPayment(payment)
    }

    const onStopPress = async () => {
        await sessionStore.stopSession()
        setIsConfirmationModalVisible(false)
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            title: I18n.t("ChargeDetail_HeaderTitle"),
            headerRight:
                sessionStore.tokenType === TokenType.OTHER
                    ? () => (
                          <IconButton
                              colorScheme="muted"
                              variant="ghost"
                              p={0.5}
                              onPress={() => setIsConfirmationModalVisible(true)}
                              isDisabled={sessionStore.status === ChargeSessionStatus.IDLE || sessionStore.status === ChargeSessionStatus.STOPPING}
                              icon={<FontAwesomeIcon icon={faStop} />}
                              _icon={{ color: "#ffffff", size: 32 }}
                          />
                      )
                    : undefined
        })
    }, [navigation, sessionStore.tokenType])

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            {sessionStore.location && (
                <AddressCard
                    name={sessionStore.location.name}
                    address={sessionStore.location.address}
                    city={sessionStore.location.city}
                    postalCode={sessionStore.location.postalCode}
                    alignItems="center"
                />
            )}
            <VStack space={2} alignContent="flex-start" marginTop={5} marginBottom={2}>
                <View style={{ backgroundColor, alignItems: "center" }}>
                    <SatoshiBalance size={36} color={textColor} satoshis={parseInt(sessionStore.valueSat)} />
                    <SatoshiBalance size={16} color={textColor} satoshis={parseInt(sessionStore.feeSat)} prependText="FEE" />
                </View>
            </VStack>
            {sessionStore.status === ChargeSessionStatus.STARTING ? (
                <View>
                    <Text style={styles.connectorInfo} textAlign="center" color={textColor} fontSize={16} bold>
                        {I18n.t("ConnectorDetail_ConfirmChargeText")}
                    </Text>
                    <BusyButton isBusy={isConfirmChargeBusy} onPress={onConfirmChargePress} style={styles.focusViewButton}>
                        {I18n.t("Button_ConfirmCharge")}
                    </BusyButton>
                </View>
            ) : (
                <View>
                    <ChargeInfo
                        colorScheme="orange"
                        marginTop={2}
                        metered={sessionStore.meteredEnergy}
                        unit="kWh"
                        estimated={sessionStore.estimatedEnergy}
                    />
                    <ChargeInfo
                        colorScheme="blue"
                        marginTop={2}
                        metered={sessionStore.meteredTime}
                        unit="mins"
                        estimated={sessionStore.estimatedTime}
                    />
                </View>
            )}
            <ScrollView style={[styles.matchParent, { backgroundColor, borderRadius: 12, marginTop: 10 }]}>
                <VStack space={3} style={{ paddingBottom: safeAreaInsets.bottom }}>
                    {sessionStore.payments.map((payment) => (
                        <PaymentButton key={payment.hash} payment={payment} onPress={onPaymentPress} />
                    ))}
                </VStack>
            </ScrollView>
            <ConfirmationModal
                isVisible={isConfirmationModalVisible}
                text={I18n.t("ConfirmationModal_StopConfirmationText")}
                buttonText={I18n.t("Button_Stop")}
                onClose={() => setIsConfirmationModalVisible(false)}
                onPress={onStopPress}
            />
            <PaymentInfoModal payment={shownPayment} onClose={() => setShownPayment(undefined)} />
        </View>
    )
}

export default observer(ChargeDetail)
