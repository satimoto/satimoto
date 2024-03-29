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
import { LightningBackend } from "types/lightningBackend"
import I18n from "utils/i18n"
import { useStore } from "hooks/useStore"

type SettingsBackendsProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "SettingsBackends">
}

const SettingsBackends = ({ navigation }: SettingsBackendsProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const safeAreaInsets = useSafeAreaInsets()
    const { lightningStore } = useStore()

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: I18n.t("SettingsBackends_HeaderTitle")
        })
    }, [navigation])

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            <ScrollView style={[styles.matchParent, { backgroundColor, borderRadius: 12, marginTop: 10 }]}>
                <VStack space={3} style={{ paddingBottom: safeAreaInsets.bottom }}>
                    <ListButton
                        key="breezsdk"
                        title={I18n.t("SettingsBackends_BreezSdkText")}
                        hint={I18n.t(
                            lightningStore.backend === LightningBackend.BREEZ_SDK ? "SettingsBackend_ActiveText" : "SettingsBackend_InactiveText"
                        )}
                        iconRight={faChevronRight}
                        onPress={() => navigation.navigate("SettingsBackend", { backend: LightningBackend.BREEZ_SDK })}
                    />
                    <ListButton
                        key="lnd"
                        title={I18n.t("SettingsBackends_LndText")}
                        hint={I18n.t(lightningStore.backend === LightningBackend.LND ? "SettingsBackend_ActiveText" : "SettingsBackend_InactiveText")}
                        iconRight={faChevronRight}
                        onPress={() => navigation.navigate("SettingsBackend", { backend: LightningBackend.LND })}
                    />
                </VStack>
            </ScrollView>
        </View>
    )
}

export default observer(SettingsBackends)
