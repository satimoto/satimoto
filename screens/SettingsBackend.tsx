import ExpandableListItem from "components/ExpandableListItem"
import HeaderBackButton from "components/HeaderBackButton"
import IconButton from "components/IconButton"
import RoundedButton from "components/RoundedButton"
import SwapBackendModal from "components/SwapBackendModal"
import { faCopy } from "@fortawesome/free-solid-svg-icons"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { Heading, HStack, Text, useTheme, View, VStack } from "native-base"
import React, { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { BackHandler } from "react-native"
import Clipboard from "@react-native-clipboard/clipboard"
import { RouteProp, StackActions, useFocusEffect } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { LightningBackend } from "types/lightningBackend"
import { WalletState } from "types/wallet"
import I18n from "utils/i18n"
import styles from "utils/styles"
import { ChargeSessionStatus } from "types/chargeSession"

const popAction = StackActions.pop()

type SettingsBackendProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "SettingsBackend">
    route: RouteProp<AppStackParamList, "SettingsBackend">
}

const SettingsBackend = ({ navigation, route }: SettingsBackendProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const focusBackgroundColor = useColor(colors.dark[400], colors.warmGray[200])
    const textColor = useColor(colors.lightText, colors.darkText)
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const [backend] = useState(route.params.backend)
    const [swapBackend, setSwapBackend] = useState(LightningBackend.NONE)
    const [isSwapBackendModalVisible, setIsSwapBackendModalVisible] = useState(false)
    const { lightningStore, sessionStore, walletStore } = useStore()

    const onBackPress = useCallback((): boolean => {
        navigation.dispatch(popAction)
        return true
    }, [navigation])

    const onBackupMnemonicPress = () => {
        navigation.navigate("SettingsBackupMnemonic", { backend })
    }

    const onImportMnemonicPress = () => {
        navigation.navigate("SettingsImportMnemonic", { backend })
    }

    useFocusEffect(
        useCallback(() => {
            const backEventListener = BackHandler.addEventListener("hardwareBackPress", onBackPress)

            return () => backEventListener.remove()
        }, [navigation])
    )

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => <HeaderBackButton tintColor={navigationOptions.headerTintColor} onPress={onBackPress} />,
            title: I18n.t("SettingsBackend_HeaderTitle")
        })
    }, [navigation])

    useEffect(() => {
        setSwapBackend(lightningStore.backend === LightningBackend.BREEZ_SDK ? LightningBackend.LND : LightningBackend.BREEZ_SDK)
    }, [lightningStore.backend])

    return (
        <View style={[styles.matchParent, { backgroundColor: focusBackgroundColor }]}>
            <View style={[styles.focusViewPanel, { backgroundColor, padding: 10 }]}>
                <View style={{ backgroundColor, alignItems: "center" }}>
                    <Heading color="white" isTruncated={true} allowFontScaling={true}>
                        {I18n.t(backend)}
                    </Heading>
                    <Text fontSize="sm" color={textColor}>
                        {I18n.t(backend === lightningStore.backend ? "SettingsBackend_ActiveText" : "SettingsBackend_InactiveText")}
                    </Text>
                </View>
                <VStack space={3} marginTop={5}>
                    {backend === lightningStore.backend && lightningStore.identityPubkey && (
                        <ExpandableListItem title="Pubkey" width="100%">
                            <HStack alignItems="center">
                                <Text style={{ color: textColor, fontSize: 16 }} marginRight={5}>
                                    {lightningStore.identityPubkey}
                                </Text>
                                <IconButton icon={faCopy} size="sm" onPress={() => Clipboard.setString(lightningStore.identityPubkey!)} />
                            </HStack>
                        </ExpandableListItem>
                    )}
                    {backend === lightningStore.backend && backend === LightningBackend.BREEZ_SDK && (
                        <View marginTop={15}>
                            <RoundedButton onPress={() => onBackupMnemonicPress()}>{I18n.t("Button_BackupMnemonic")}</RoundedButton>
                        </View>
                    )}
                    {backend !== lightningStore.backend && backend === LightningBackend.BREEZ_SDK && (
                        <View marginTop={15}>
                            <Text style={styles.connectorInfo} textAlign="center" color={textColor} fontSize={16}>
                                {I18n.t("SettingsBackend_ImportMnemonicText")}
                            </Text>
                            <RoundedButton onPress={() => onImportMnemonicPress()}>{I18n.t("Button_ImportMnemonic")}</RoundedButton>
                        </View>
                    )}
                    <RoundedButton
                        colorScheme="red"
                        marginTop={10}
                        isDisabled={walletStore.state !== WalletState.STARTED || sessionStore.status !== ChargeSessionStatus.IDLE}
                        onPress={() => setIsSwapBackendModalVisible(true)}
                    >
                        {I18n.t("Button_Switch", {
                            text: I18n.t(swapBackend)
                        })}
                    </RoundedButton>
                </VStack>
            </View>
            <SwapBackendModal isVisible={isSwapBackendModalVisible} backend={swapBackend} onClose={() => setIsSwapBackendModalVisible(false)} />
        </View>
    )
}

export default observer(SettingsBackend)
