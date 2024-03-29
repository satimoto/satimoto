import ListButton from "components/ListButton"
import { faChevronRight } from "@fortawesome/free-solid-svg-icons"
import React, { useLayoutEffect } from "react"
import { observer } from "mobx-react"
import { useTheme, VStack } from "native-base"
import { ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import styles from "utils/styles"
import useColor from "hooks/useColor"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import I18n from "utils/i18n"

type SettingsChargingProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "SettingsCharging">
}

const SettingsCharging = ({ navigation }: SettingsChargingProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const safeAreaInsets = useSafeAreaInsets()

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: I18n.t("SettingsCharging_HeaderTitle")
        })
    }, [navigation])

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            <ScrollView style={[styles.matchParent, { backgroundColor, borderRadius: 12, marginTop: 10 }]}>
                <VStack space={3} style={{ paddingBottom: safeAreaInsets.bottom }}>
                    <ListButton
                        key="battery"
                        title={I18n.t("SettingsCharging_ButtonBattery")}
                        iconRight={faChevronRight}
                        onPress={() => navigation.navigate("SettingsBattery")}
                    />
                    <ListButton
                        key="tokens"
                        title={I18n.t("SettingsCharging_ButtonTokens")}
                        iconRight={faChevronRight}
                        onPress={() => navigation.navigate("SettingsTokens")}
                    />
                    <ListButton
                        key="sessions"
                        title={I18n.t("SettingsCharging_ButtonSessions")}
                        iconRight={faChevronRight}
                        onPress={() => navigation.navigate("SettingsSessions")}
                    />
                </VStack>
            </ScrollView>
        </View>
    )
}

export default observer(SettingsCharging)
