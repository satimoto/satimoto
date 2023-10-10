import BusyButton from "components/BusyButton"
import MnemonicInput from "components/MnemonicInput"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { useStore } from "hooks/useStore"
import React, { useCallback, useLayoutEffect, useState } from "react"
import { observer } from "mobx-react"
import { HStack, Text, useColorModeValue, useTheme, VStack } from "native-base"
import { HeaderBackButton } from "@react-navigation/elements"
import { RouteProp, StackActions, useFocusEffect } from "@react-navigation/native"
import { BackHandler, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { errorToString } from "utils/conversion"
import I18n from "utils/i18n"
import { Log } from "utils/logging"
import styles from "utils/styles"
import { LightningBackend } from "types/lightningBackend"

const log = new Log("SettingsBackupMnemonic")

const popAction = StackActions.pop()

type SettingsBackupMnemonicProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "SettingsBackupMnemonic">
    route: RouteProp<AppStackParamList, "SettingsBackupMnemonic">
}

const SettingsBackupMnemonic = ({ navigation, route }: SettingsBackupMnemonicProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const errorColor = useColorModeValue("error.300", "error.500")
    const textColor = useColorModeValue("lightText", "darkText")
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const safeAreaInsets = useSafeAreaInsets()
    const [backend] = useState(route.params.backend)
    const [isBusy, setIsBusy] = useState(false)
    const [showMnemonic, setShowMnemonic] = useState(false)
    const [lastError, setLastError] = useState("")
    const [mnemonic, setMnemonic] = useState<string[]>()
    const { walletStore } = useStore()

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: I18n.t("SettingsBackupMnemonic_HeaderTitle")
        })
    }, [navigation])

    const onBackPress = useCallback((): boolean => {
        navigation.dispatch(popAction)
        return true
    }, [navigation])

    const onOkPress = async () => {
        setIsBusy(true)

        try {
            const backendMnemonic = await walletStore.getMnemonic(backend)

            setMnemonic(backendMnemonic)
            setShowMnemonic(true)
        } catch (error) {
            setLastError(errorToString(error))
            log.debug(`SAT0107 onOkPress: ${error}`, true)
        }

        setIsBusy(false)
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
            title: I18n.t("SettingsBackupMnemonic_HeaderTitle")
        })
    }, [navigation])

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            {!showMnemonic && (
                <VStack flex={1} alignItems="center" justifyContent="center" style={{ paddingBottom: safeAreaInsets.bottom }}>
                    <Text color={textColor} textAlign="center" bold paddingX={5}>
                        {I18n.t(
                            backend === LightningBackend.BREEZ_SDK
                                ? "SettingsBackupMnemonic_BreezSdkBackupText"
                                : "SettingsBackupMnemonic_LndBackupText"
                        )}
                    </Text>
                    <Text color={errorColor} paddingX={5}>
                        {lastError}
                    </Text>
                    <BusyButton isBusy={isBusy} marginTop={1} marginX={4} onPress={onOkPress}>
                        {I18n.t("Button_Ok")}
                    </BusyButton>
                </VStack>
            )}
            {showMnemonic && mnemonic && (
                <VStack flex={1} justifyContent="space-evenly" style={{ paddingBottom: safeAreaInsets.bottom }}>
                    <HStack justifyContent="space-evenly">
                        <MnemonicInput value={mnemonic[0]} wordNo={1} width="40%" isDisabled={true} />
                        <MnemonicInput value={mnemonic[1]} wordNo={2} width="40%" isDisabled={true} />
                    </HStack>
                    <HStack justifyContent="space-evenly">
                        <MnemonicInput value={mnemonic[2]} wordNo={3} width="40%" isDisabled={true} />
                        <MnemonicInput value={mnemonic[3]} wordNo={4} width="40%" isDisabled={true} />
                    </HStack>
                    <HStack justifyContent="space-evenly">
                        <MnemonicInput value={mnemonic[4]} wordNo={5} width="40%" isDisabled={true} />
                        <MnemonicInput value={mnemonic[5]} wordNo={6} width="40%" isDisabled={true} />
                    </HStack>
                    <HStack justifyContent="space-evenly">
                        <MnemonicInput value={mnemonic[6]} wordNo={7} width="40%" isDisabled={true} />
                        <MnemonicInput value={mnemonic[7]} wordNo={8} width="40%" isDisabled={true} />
                    </HStack>
                    <HStack justifyContent="space-evenly">
                        <MnemonicInput value={mnemonic[8]} wordNo={9} width="40%" isDisabled={true} />
                        <MnemonicInput value={mnemonic[9]} wordNo={10} width="40%" isDisabled={true} />
                    </HStack>
                    <HStack justifyContent="space-evenly">
                        <MnemonicInput value={mnemonic[10]} wordNo={11} width="40%" isDisabled={true} />
                        <MnemonicInput value={mnemonic[11]} wordNo={12} width="40%" isDisabled={true} />
                    </HStack>
                </VStack>
            )}
        </View>
    )
}

export default observer(SettingsBackupMnemonic)
