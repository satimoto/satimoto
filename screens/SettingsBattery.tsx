import InfoBox from "components/InfoBox"
import ListInput from "components/ListInput"
import React, { useEffect, useLayoutEffect, useState } from "react"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { useTheme, Text, HStack, VStack, useColorModeValue } from "native-base"
import { Linking, ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import styles from "utils/styles"
import useColor from "hooks/useColor"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import I18n from "utils/i18n"
import RoundedButton from "components/RoundedButton"

type SettingsBatteryProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "SettingsBattery">
}

const SettingsBattery = ({ navigation }: SettingsBatteryProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const textColor = useColorModeValue("lightText", "darkText")
    const safeAreaInsets = useSafeAreaInsets()
    const [batteryCapacity, setBatteryCapacity] = useState("-")
    const [batteryPowerAc, setBatteryPowerAc] = useState("-")
    const [batteryPowerDc, setBatteryPowerDc] = useState("-")
    const { settingStore } = useStore()

    const onBatteryCapacityChangeText = (text: string) => {
        const value = parseFloat(text)

        if (!value || value > 0.0) {
            settingStore.setBatterySettings(value, settingStore.batteryPowerAc, settingStore.batteryPowerDc)
        }
    }

    const onBatteryPowerAcChangeText = (text: string) => {
        const value = parseFloat(text)

        if (!value || value > 0.0) {
            settingStore.setBatterySettings(settingStore.batteryCapacity, value, settingStore.batteryPowerDc)
        }
    }

    const onBatteryPowerDcChangeText = (text: string) => {
        const value = parseFloat(text)

        if (!value || value > 0.0) {
            settingStore.setBatterySettings(settingStore.batteryCapacity, settingStore.batteryPowerAc, value)
        }
    }

    const onWebsitePress = () => {
        Linking.openURL("https://ev-database.org/")
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: I18n.t("SettingsBattery_HeaderTitle")
        })
    }, [navigation])

    useEffect(() => {
        setBatteryCapacity(settingStore.batteryCapacity ? settingStore.batteryCapacity.toString() : "")
        setBatteryPowerAc(settingStore.batteryPowerAc ? settingStore.batteryPowerAc.toString() : "")
        setBatteryPowerDc(settingStore.batteryPowerDc ? settingStore.batteryPowerDc.toString() : "")
    }, [settingStore.batteryCapacity, settingStore.batteryPowerAc, settingStore.batteryPowerDc])

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            <ScrollView style={[styles.matchParent, { backgroundColor, borderRadius: 12, marginTop: 10 }]}>
                <VStack space={3} style={{ paddingBottom: safeAreaInsets.bottom }}>
                    <InfoBox color="white">
                        <Text color={textColor}>{I18n.t("SettingsBattery_AboutText")}</Text>
                        <HStack marginTop={2}>
                            <Text flexBasis={0} flexGrow={12} color={textColor}>
                                {I18n.t("SettingsBattery_MoreInfoText")}
                            </Text>
                            <View>
                                <RoundedButton marginTop={1} size="md" onPress={onWebsitePress}>
                                    EV Database
                                </RoundedButton>
                            </View>
                        </HStack>
                    </InfoBox>
                    <ListInput
                        key="batterycapacity"
                        title={I18n.t("SettingsBattery_CapacityText")}
                        titleWeight="bold"
                        hint={I18n.t("SettingsBattery_CapacityHint")}
                        subtext={I18n.t("SettingsBattery_CapacitySubtext")}
                        style={styles.listSwitch}
                        keyboardType="number-pad"
                        value={batteryCapacity}
                        valueFormat="%s kWh"
                        onChangeText={onBatteryCapacityChangeText}
                    />
                    <ListInput
                        key="batterypowerac"
                        title={I18n.t("SettingsBattery_PowerAcText")}
                        titleWeight="bold"
                        hint={I18n.t("SettingsBattery_PowerAcHint")}
                        subtext={I18n.t("SettingsBattery_PowerAcSubtext")}
                        style={styles.listSwitch}
                        keyboardType="number-pad"
                        value={batteryPowerAc}
                        valueFormat="%s kW"
                        onChangeText={onBatteryPowerAcChangeText}
                    />
                    <ListInput
                        key="batterypowerdc"
                        title={I18n.t("SettingsBattery_PowerDcText")}
                        titleWeight="bold"
                        hint={I18n.t("SettingsBattery_PowerDcHint")}
                        subtext={I18n.t("SettingsBattery_PowerDcSubtext")}
                        style={styles.listSwitch}
                        keyboardType="number-pad"
                        value={batteryPowerDc}
                        valueFormat="%s kW"
                        onChangeText={onBatteryPowerDcChangeText}
                    />
                </VStack>
            </ScrollView>
        </View>
    )
}

export default observer(SettingsBattery)
