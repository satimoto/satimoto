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
import { APPLICATION_ID } from "utils/build"
import { IS_ANDROID } from "utils/constants"
import I18n from "utils/i18n"

type AdvancedProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "Advanced">
}

const Advanced = ({ navigation }: AdvancedProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const safeAreaInsets = useSafeAreaInsets()
    const [includeChannelReserve, setIncludeChannelReserve] = useState(false)
    const { settingStore } = useStore()

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: I18n.t("Advanced_HeaderTitle")
        })
    }, [navigation])

    useEffect(() => {
        setIncludeChannelReserve(settingStore.includeChannelReserve)
    }, [])

    useEffect(() => {
        settingStore.setIncludeChannelReserve(includeChannelReserve)
    }, [includeChannelReserve])

    const onIncludeChannelReserveChange = useCallback(() => {
        setIncludeChannelReserve(!includeChannelReserve)
    }, [includeChannelReserve])

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
                        title={I18n.t("Advanced_BatteryOptimizationText")}
                        hint={I18n.t("Advanced_BatteryOptimizationHint")}
                        iconRight={faChevronRight}
                        onPress={onBatteryOptimization}
                    />
                    <ListButton
                        key="channels"
                        title={I18n.t("Advanced_ChannelListText")}
                        iconRight={faChevronRight}
                        onPress={() => navigation.navigate("ChannelList")}
                    />
                    <ListButton
                        key="onchain"
                        title={I18n.t("Advanced_OnChainText")}
                        iconRight={faChevronRight}
                        onPress={() => navigation.navigate("OnChain")}
                    />
                    <ListButton
                        key="send-report"
                        title={I18n.t("Advanced_SendReportText")}
                        iconRight={faChevronRight}
                        onPress={() => navigation.navigate("SendReport")}
                    />
                    <ListSwitch
                        key="channelreserve"
                        title={I18n.t("Advanced_IncludeChannelReserveText")}
                        titleWeight="bold"
                        hint={I18n.t("Advanced_IncludeChannelReserveHint")}
                        style={styles.listSwitch}
                        isChecked={includeChannelReserve}
                        onToggle={onIncludeChannelReserveChange}
                    />
                </VStack>
            </ScrollView>
        </View>
    )
}

export default observer(Advanced)
