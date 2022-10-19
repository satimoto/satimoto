import ConfirmationModal from "components/ConfirmationModal"
import LocationAddress from "components/LocationAddress"
import PaymentButton from "components/PaymentButton"
import SatoshiBalance from "components/SatoshiBalance"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faStop } from "@fortawesome/free-solid-svg-icons"
import useColor from "hooks/useColor"
import { observer } from "mobx-react"
import { IconButton, useTheme, VStack } from "native-base"
import React, { useLayoutEffect, useState } from "react"
import { ScrollView, View } from "react-native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import I18n from "utils/i18n"
import styles from "utils/styles"
import { useStore } from "hooks/useStore"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ChargeSessionStatus } from "types/chargeSession"
import { TokenType } from "types/token"

type ChargeDetailProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "ChargeDetail">
}

const ChargeDetail = ({ navigation }: ChargeDetailProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const textColor = useColor(colors.lightText, colors.darkText)
    const safeAreaInsets = useSafeAreaInsets()
    const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false)
    const { sessionStore } = useStore()

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
    }, [navigation])

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            {sessionStore.location && <LocationAddress location={sessionStore.location} alignItems="center" />}
            <VStack space={2} alignContent="flex-start" marginTop={5} marginBottom={2}>
                <View style={{ backgroundColor, alignItems: "center" }}>
                    <SatoshiBalance size={36} color={textColor} satoshis={parseInt(sessionStore.valueMsat)} />
                    <SatoshiBalance size={16} color={textColor} satoshis={parseInt(sessionStore.feeSat)} prependText="FEE" />
                </View>
            </VStack>
            <ScrollView style={[styles.matchParent, { backgroundColor, borderRadius: 12 }]}>
                <VStack space={3} style={{ paddingBottom: safeAreaInsets.bottom }}>
                    {sessionStore.payments.map((payment) => (
                        <PaymentButton key={payment.hash} payment={payment} />
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
        </View>
    )
}

export default observer(ChargeDetail)
