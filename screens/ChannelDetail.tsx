import CloseChannelModal from "components/CloseChannelModal"
import ExpandableListItem from "components/ExpandableListItem"
import HeaderBackButton from "components/HeaderBackButton"
import IconButton from "components/IconButton"
import InfoListItem from "components/InfoListItem"
import RoundedButton from "components/RoundedButton"
import SatoshiBalance from "components/SatoshiBalance"
import { faCopy } from "@fortawesome/free-solid-svg-icons"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { observer } from "mobx-react"
import { HStack, Text, useTheme, VStack } from "native-base"
import React, { useCallback, useLayoutEffect, useState } from "react"
import { BackHandler, View } from "react-native"
import Clipboard from "@react-native-clipboard/clipboard"
import { RouteProp, StackActions, useFocusEffect } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import I18n from "utils/i18n"
import styles from "utils/styles"

const popAction = StackActions.pop()

type ChannelDetailProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "ChannelDetail">
    route: RouteProp<AppStackParamList, "ChannelDetail">
}

const ChannelDetail = ({ navigation, route }: ChannelDetailProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const focusBackgroundColor = useColor(colors.dark[400], colors.warmGray[200])
    const textColor = useColor(colors.lightText, colors.darkText)
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const [channel] = useState(route.params.channel)
    const [isCloseChannelModalVisible, setIsCloseChannelModalVisible] = useState(false)

    const onBackPress = useCallback((): boolean => {
        navigation.dispatch(popAction)
        return true
    }, [navigation])

    useFocusEffect(
        useCallback(() => {
            const backEventListener = BackHandler.addEventListener("hardwareBackPress", onBackPress)

            return () => backEventListener.remove()
        }, [navigation])
    )

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => <HeaderBackButton tintColor={navigationOptions.headerTintColor} onPress={onBackPress} />,
            title: I18n.t("ChannelDetail_HeaderTitle")
        })
    }, [navigation])

    return (
        <View style={[styles.matchParent, { backgroundColor: focusBackgroundColor }]}>
            <View style={[styles.focusViewPanel, { backgroundColor, padding: 10 }]}>
                <View style={{ backgroundColor, alignItems: "center" }}>
                    <SatoshiBalance size={36} color={textColor} satoshis={channel.capacity} />
                    <Text fontSize="sm" color={textColor}>
                        CAPACITY
                    </Text>
                </View>
                <VStack space={3} marginTop={5}>
                    <InfoListItem title="Channel ID">
                        <Text style={{ color: textColor, fontSize: 18 }}>{channel.chanId}</Text>
                    </InfoListItem>
                    <ExpandableListItem title="Channel Point" width="100%">
                        <HStack alignItems="center">
                            <Text style={{ color: textColor, fontSize: 16 }} marginRight={5}>
                                {channel.channelPoint}
                            </Text>
                            <IconButton icon={faCopy} size="sm" onPress={() => Clipboard.setString(channel.channelPoint)} />
                        </HStack>
                    </ExpandableListItem>
                    <ExpandableListItem title="Peer" width="100%">
                        <HStack alignItems="center">
                            <Text style={{ color: textColor, fontSize: 16 }} marginRight={5}>
                                {channel.remotePubkey}
                            </Text>
                            <IconButton icon={faCopy} size="sm" onPress={() => Clipboard.setString(channel.remotePubkey)} />
                        </HStack>
                    </ExpandableListItem>
                    {channel.closingTxid ? (
                        <ExpandableListItem title="Closing Txid">
                            <HStack alignItems="center">
                                <Text style={{ color: textColor, fontSize: 16 }} marginRight={5}>
                                    {channel.closingTxid}
                                </Text>
                                <IconButton icon={faCopy} size="sm" onPress={() => Clipboard.setString(channel.closingTxid!)} />
                            </HStack>
                        </ExpandableListItem>
                    ) : (
                        <RoundedButton colorScheme="red" marginTop={10} onPress={() => setIsCloseChannelModalVisible(true)}>
                            {I18n.t("Button_Close")}
                        </RoundedButton>
                    )}
                </VStack>
            </View>
            <CloseChannelModal isVisible={isCloseChannelModalVisible} channel={channel} onClose={() => setIsCloseChannelModalVisible(false)} />
        </View>
    )
}

export default observer(ChannelDetail)
