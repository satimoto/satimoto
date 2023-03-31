import ChannelButton from "components/ChannelButton"
import useColor from "hooks/useColor"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import ChannelModel from "models/Channel"
import { useTheme, VStack } from "native-base"
import React, { useLayoutEffect } from "react"
import { ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import styles from "utils/styles"
import I18n from "utils/i18n"

type SettingsChannelsProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "SettingsChannels">
}

const SettingsChannels = ({ navigation }: SettingsChannelsProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const safeAreaInsets = useSafeAreaInsets()
    const { channelStore } = useStore()

    useLayoutEffect(() => {
        navigation.setOptions({
            title: I18n.t("SettingsChannels_HeaderTitle")
        })
    }, [navigation])

    const onChannelPress = (channel: ChannelModel) => {
        navigation.navigate("SettingsChannel", {channel: channel})
    }

    return (
        <View style={styles.matchParent}>
            <ScrollView style={[styles.matchParent, { padding: 10, backgroundColor }]}>
                <VStack space={3} style={{ paddingBottom: safeAreaInsets.bottom }}>
                    {channelStore.channels.map((channel) => (
                        <ChannelButton key={channel.channelPoint} channel={channel} onPress={onChannelPress} />
                    ))}
                </VStack>
            </ScrollView>
        </View>
    )
}

export default observer(SettingsChannels)
