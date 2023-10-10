import SendCoinsModal from "components/SendCoinsModal"
import ExpandableListItem from "components/ExpandableListItem"
import HeaderBackButton from "components/HeaderBackButton"
import IconButton from "components/IconButton"
import RoundedButton from "components/RoundedButton"
import SatoshiBalance from "components/SatoshiBalance"
import { faCopy } from "@fortawesome/free-solid-svg-icons"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { observer } from "mobx-react"
import { HStack, Text, useTheme, VStack } from "native-base"
import React, { useCallback, useLayoutEffect, useState } from "react"
import { BackHandler, RefreshControl, ScrollView, View } from "react-native"
import Clipboard from "@react-native-clipboard/clipboard"
import { StackActions, useFocusEffect } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import I18n from "utils/i18n"
import styles from "utils/styles"
import { useStore } from "hooks/useStore"

const popAction = StackActions.pop()

type SettingsOnChainProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "SettingsOnChain">
}

const SettingsOnChain = ({ navigation }: SettingsOnChainProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const focusBackgroundColor = useColor(colors.dark[400], colors.warmGray[200])
    const textColor = useColor(colors.lightText, colors.darkText)
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const [isSendCoinsModalVisible, setIsSendCoinsModalVisible] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const { walletStore } = useStore()

    const onBackPress = useCallback((): boolean => {
        navigation.dispatch(popAction)
        return true
    }, [navigation])

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        await walletStore.refreshWalletBalance()
        setRefreshing(false)
    }, [])

    useFocusEffect(
        useCallback(() => {
            const backEventListener = BackHandler.addEventListener("hardwareBackPress", onBackPress)

            return () => backEventListener.remove()
        }, [navigation])
    )

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => <HeaderBackButton tintColor={navigationOptions.headerTintColor} onPress={onBackPress} />,
            title: I18n.t("SettingsOnChain_HeaderTitle")
        })
    }, [navigation])

    return (
        <View style={[styles.matchParent, { backgroundColor: focusBackgroundColor }]}>
            <ScrollView
                style={[styles.matchParent, { backgroundColor: focusBackgroundColor }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={[styles.focusViewPanel, { backgroundColor, padding: 10 }]}>
                    <View style={{ backgroundColor, alignItems: "center" }}>
                        <SatoshiBalance size={36} color={textColor} satoshis={walletStore.totalBalance} />
                        <Text fontSize="sm" color={textColor}>
                            {I18n.t("SettingsOnChain_BalanceText")}
                        </Text>
                    </View>
                    <VStack space={3} marginTop={5}>
                        {walletStore.lastTxid && (
                            <ExpandableListItem title="Last Txid">
                                <HStack alignItems="center">
                                    <Text style={{ color: textColor, fontSize: 16 }} marginRight={5}>
                                        {walletStore.lastTxid}
                                    </Text>
                                    <IconButton icon={faCopy} size="sm" onPress={() => Clipboard.setString(walletStore.lastTxid!)} />
                                </HStack>
                            </ExpandableListItem>
                        )}
                        {walletStore.totalBalance > 0 && (
                            <RoundedButton colorScheme="red" marginTop={10} onPress={() => setIsSendCoinsModalVisible(true)}>
                                {I18n.t("Button_Send")}
                            </RoundedButton>
                        )}
                    </VStack>
                </View>
            </ScrollView>
            <SendCoinsModal isVisible={isSendCoinsModalVisible} onClose={() => setIsSendCoinsModalVisible(false)} />
        </View>
    )
}

export default observer(SettingsOnChain)
