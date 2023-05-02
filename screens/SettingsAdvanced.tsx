import ListButton from "components/ListButton"
import ListSwitch from "components/ListSwitch"
import { faChevronRight } from "@fortawesome/free-solid-svg-icons"
import React, { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { useTheme, VStack } from "native-base"
import { Linking, ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import styles from "utils/styles"
import useColor from "hooks/useColor"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { LightningBackend } from "types/lightningBackend"
import { DEBUG } from "utils/build"
import { IS_ANDROID } from "utils/constants"
import I18n from "utils/i18n"

type SettingsAdvancedProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "SettingsAdvanced">
}

const SettingsAdvanced = ({ navigation }: SettingsAdvancedProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const safeAreaInsets = useSafeAreaInsets()
    const [includeChannelReserve, setIncludeChannelReserve] = useState(false)
    const [traceLogEnabled, setTraceLogEnabled] = useState(false)
    const { lightningStore, settingStore } = useStore()

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: I18n.t("SettingsAdvanced_HeaderTitle")
        })
    }, [navigation])

    useEffect(() => {
        setIncludeChannelReserve(settingStore.includeChannelReserve)
        setTraceLogEnabled(settingStore.traceLogEnabled)
    }, [])

    useEffect(() => {
        settingStore.setIncludeChannelReserve(includeChannelReserve)
    }, [includeChannelReserve])

    useEffect(() => {
        settingStore.setTraceLogEnabled(traceLogEnabled)
    }, [traceLogEnabled])

    const onIncludeChannelReserveChange = useCallback(() => {
        setIncludeChannelReserve(!includeChannelReserve)
    }, [includeChannelReserve])

    const onTraceLogEnabledChange = useCallback(() => {
        setTraceLogEnabled(!traceLogEnabled)
    }, [traceLogEnabled])

    const onBatteryOptimization = useCallback(() => {
        if (IS_ANDROID) {
            Linking.sendIntent("android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS")
        } else {
            Linking.openSettings()
        }
    }, [])

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            <ScrollView style={[styles.matchParent, { backgroundColor, borderRadius: 12, marginTop: 10 }]}>
                <VStack space={3} style={{ paddingBottom: safeAreaInsets.bottom }}>
                    <ListButton
                        key="battery"
                        title={I18n.t("SettingsAdvanced_BatteryOptimizationText")}
                        hint={I18n.t("SettingsAdvanced_BatteryOptimizationHint")}
                        iconRight={faChevronRight}
                        onPress={onBatteryOptimization}
                    />
                    {lightningStore.backend === LightningBackend.LND && (
                        <ListButton
                            key="channels"
                            title={I18n.t("SettingsAdvanced_ChannelsText")}
                            iconRight={faChevronRight}
                            onPress={() => navigation.navigate("SettingsChannels")}
                        />
                    )}
                    <ListButton
                        key="onchain"
                        title={I18n.t("SettingsAdvanced_OnChainText")}
                        iconRight={faChevronRight}
                        onPress={() => navigation.navigate("SettingsOnChain")}
                    />
                    <ListButton
                        key="backends"
                        title={I18n.t("SettingsAdvanced_BackendsText")}
                        iconRight={faChevronRight}
                        onPress={() => navigation.navigate("SettingsBackends")}
                    />
                    <ListButton
                        key="fiatcurrencies"
                        title={I18n.t("SettingsAdvanced_FiatCurrenciesText")}
                        iconRight={faChevronRight}
                        onPress={() => navigation.navigate("SettingsFiatCurrencies")}
                    />
                    <ListButton
                        key="sendreport"
                        title={I18n.t("SettingsAdvanced_SendReportText")}
                        iconRight={faChevronRight}
                        onPress={() => navigation.navigate("SettingsSendReport")}
                    />
                    {DEBUG && (
                        <ListSwitch
                            key="tracelogenabled"
                            title={I18n.t("SettingsAdvanced_TraceLogEnabledText")}
                            titleWeight="bold"
                            hint={I18n.t("SettingsAdvanced_TraceLogEnabledHint")}
                            style={styles.listSwitch}
                            isChecked={traceLogEnabled}
                            onToggle={onTraceLogEnabledChange}
                        />
                    )}
                    <ListSwitch
                        key="channelreserve"
                        title={I18n.t("SettingsAdvanced_IncludeChannelReserveText")}
                        titleWeight="bold"
                        hint={I18n.t("SettingsAdvanced_IncludeChannelReserveHint")}
                        style={styles.listSwitch}
                        isChecked={includeChannelReserve}
                        onToggle={onIncludeChannelReserveChange}
                    />
                </VStack>
            </ScrollView>
        </View>
    )
}

export default observer(SettingsAdvanced)
