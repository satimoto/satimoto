import SessionButton from "components/SessionButton"
import useColor from "hooks/useColor"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import SessionModel from "models/Session"
import { useTheme, VStack } from "native-base"
import React, { useCallback, useLayoutEffect, useState } from "react"
import { RefreshControl, ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import I18n from "utils/i18n"
import styles from "utils/styles"

type SettingsSessionsProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "SettingsSessions">
}

const SettingsSessions = ({ navigation }: SettingsSessionsProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const safeAreaInsets = useSafeAreaInsets()
    const [refreshing, setRefreshing] = useState(false)
    const { sessionStore } = useStore()

    useLayoutEffect(() => {
        navigation.setOptions({
            title: I18n.t("SettingsSessions_HeaderTitle")
        })
    }, [navigation])

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        await sessionStore.refreshSessions()
        setRefreshing(false)
    }, [])

    const onSessionPress = (session: SessionModel) => {
        navigation.navigate("SettingsSession", {session: session})
    }

    return (
        <View style={styles.matchParent}>
            <ScrollView
                style={[styles.matchParent, { padding: 10, backgroundColor }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <VStack space={3} style={{ paddingBottom: safeAreaInsets.bottom }}>
                    {sessionStore.sessions.map((session) => (
                        <SessionButton key={session.uid} session={session} onPress={onSessionPress} />
                    ))}
                </VStack>
            </ScrollView>
        </View>
    )
}

export default observer(SettingsSessions)
