import BusyButton from "components/BusyButton"
import MnemonicInput from "components/MnemonicInput"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { useStore } from "hooks/useStore"
import React, { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { observer } from "mobx-react"
import { HStack, Text, useColorModeValue, useTheme, VStack } from "native-base"
import { HeaderBackButton } from "@react-navigation/elements"
import { RouteProp, StackActions, useFocusEffect } from "@react-navigation/native"
import { BackHandler, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import I18n from "utils/i18n"
import { Log } from "utils/logging"
import styles from "utils/styles"

const log = new Log("SettingsImportMnemonic")

const popAction = StackActions.pop()

type SettingsImportMnemonicProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "SettingsImportMnemonic">
    route: RouteProp<AppStackParamList, "SettingsImportMnemonic">
}

const SettingsImportMnemonic = ({ navigation, route }: SettingsImportMnemonicProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const errorColor = useColorModeValue("error.300", "error.500")
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const safeAreaInsets = useSafeAreaInsets()
    const [backend] = useState(route.params.backend)
    const [isBusy, setIsBusy] = useState(false)
    const [isDisabled, setIsDisabled] = useState(false)
    const [lastError, setLastError] = useState("")
    const [mnemonic, setMnemonic] = useState(Array<string>(12).fill(""))
    const { walletStore } = useStore()

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: I18n.t("SettingsImportMnemonic_HeaderTitle")
        })
    }, [navigation])

    const onBackPress = useCallback((): boolean => {
        navigation.dispatch(popAction)
        return true
    }, [navigation])

    const onMnemonicChange = (index: number, value: string) => {
        setMnemonic((mnemonic) => [...mnemonic.slice(0, index), value, ...mnemonic.slice(index + 1)])
    }

    const onOkPress = async () => {
        try {
            setIsBusy(true)
            await walletStore.setMnemonic(backend, mnemonic)
            onBackPress()
        } catch (error) {
            setLastError(I18n.t("SettingsImportMnemonic_MnemonicError"))
            log.debug(`SAT0106 onOkPress: ${error}`, true)
        } finally {
            setIsBusy(false)
        }
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
            title: I18n.t("SettingsImportMnemonic_HeaderTitle")
        })
    }, [navigation])

    useEffect(() => {
        for (var i = 0; i < 12; i++) {
            if (mnemonic[i].length <= 2) {
                setIsDisabled(true)
                return
            }
        }

        setIsDisabled(false)
    }, [mnemonic])

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            <VStack flex={1} justifyContent="space-evenly" style={{ paddingBottom: safeAreaInsets.bottom }}>
                <HStack justifyContent="space-evenly">
                    <MnemonicInput value={mnemonic[0]} wordNo={1} width="40%" onChangeText={(text) => onMnemonicChange(0, text)} />
                    <MnemonicInput value={mnemonic[1]} wordNo={2} width="40%" onChangeText={(text) => onMnemonicChange(1, text)} />
                </HStack>
                <HStack justifyContent="space-evenly">
                    <MnemonicInput value={mnemonic[2]} wordNo={3} width="40%" onChangeText={(text) => onMnemonicChange(2, text)} />
                    <MnemonicInput value={mnemonic[3]} wordNo={4} width="40%" onChangeText={(text) => onMnemonicChange(3, text)} />
                </HStack>
                <HStack justifyContent="space-evenly">
                    <MnemonicInput value={mnemonic[4]} wordNo={5} width="40%" onChangeText={(text) => onMnemonicChange(4, text)} />
                    <MnemonicInput value={mnemonic[5]} wordNo={6} width="40%" onChangeText={(text) => onMnemonicChange(5, text)} />
                </HStack>
                <HStack justifyContent="space-evenly">
                    <MnemonicInput value={mnemonic[6]} wordNo={7} width="40%" onChangeText={(text) => onMnemonicChange(6, text)} />
                    <MnemonicInput value={mnemonic[7]} wordNo={8} width="40%" onChangeText={(text) => onMnemonicChange(7, text)} />
                </HStack>
                <HStack justifyContent="space-evenly">
                    <MnemonicInput value={mnemonic[8]} wordNo={9} width="40%" onChangeText={(text) => onMnemonicChange(8, text)} />
                    <MnemonicInput value={mnemonic[9]} wordNo={10} width="40%" onChangeText={(text) => onMnemonicChange(9, text)} />
                </HStack>
                <HStack justifyContent="space-evenly">
                    <MnemonicInput value={mnemonic[10]} wordNo={11} width="40%" onChangeText={(text) => onMnemonicChange(10, text)} />
                    <MnemonicInput value={mnemonic[11]} wordNo={12} width="40%" onChangeText={(text) => onMnemonicChange(11, text)} />
                </HStack>
                <VStack>
                    <Text color={errorColor} paddingX={5}>
                        {lastError}
                    </Text>
                    <BusyButton isBusy={isBusy} isDisabled={isDisabled} marginTop={1} marginX={4} onPress={onOkPress}>
                        {I18n.t("Button_Ok")}
                    </BusyButton>
                </VStack>
            </VStack>
        </View>
    )
}

export default observer(SettingsImportMnemonic)
