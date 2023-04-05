import BusyButton from "components/BusyButton"
import HeaderBackButton from "components/HeaderBackButton"
import useColor from "hooks/useColor"
import { useStore } from "hooks/useStore"
import useNavigationOptions from "hooks/useNavigationOptions"
import { observer } from "mobx-react"
import { Text, TextArea, useColorModeValue, useTheme, VStack } from "native-base"
import { lnrpc } from "proto/proto"
import React, { useCallback, useLayoutEffect, useState } from "react"
import { BackHandler, Platform, View } from "react-native"
import * as breezSdk from "react-native-breez-sdk"
import { FileLogger } from "react-native-file-logger"
import { StackActions, useFocusEffect } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import * as lnd from "services/lnd"
import { AppStackParamList } from "screens/AppStack"
import { LightningBackend } from "types/lightningBackend"
import { APPLICATION_VERSION } from "utils/constants"
import { errorToString } from "utils/conversion"
import I18n from "utils/i18n"
import styles from "utils/styles"

const popAction = StackActions.pop()

type SettingsSendReportProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "SettingsSendReport">
}

const SettingsSendReport = ({ navigation }: SettingsSendReportProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const focusBackgroundColor = useColor(colors.dark[400], colors.warmGray[200])
    const textColor = useColorModeValue("lightText", "darkText")
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const [isBusy, setIsBusy] = useState(false)
    const [isInvalid, setIsInvalid] = useState(true)
    const [reportBody, setReportBody] = useState("")
    const { lightningStore } = useStore()

    const onReportBodyChange = (text: string) => {
        setReportBody(text)
        setIsInvalid(reportBody.length === 0)
    }

    const onConfirmPress = async () => {
        setIsBusy(true)
        let nodeInfo = {}

        try {
            if (lightningStore.backend === LightningBackend.BREEZ_SDK) {
                nodeInfo = await breezSdk.nodeInfo()
            } else if (lightningStore.backend === LightningBackend.LND) {
                const getInfoResponse: lnrpc.GetInfoResponse = await lnd.getInfo()
                nodeInfo = getInfoResponse.toJSON()
            }
        } catch (err) {
            nodeInfo = { error: errorToString(err) }
        }

        try {
            await FileLogger.sendLogFilesByEmail({
                to: "hello@satimoto.com",
                subject: "Issue Report",
                body:
                    `Backend: ${lightningStore.backend}\n` +
                    `OS: ${Platform.OS} - ${Platform.Version}\n` +
                    `Version: ${APPLICATION_VERSION}\n` +
                    `\n` +
                    `${reportBody}` +
                    `\n\n` +
                    JSON.stringify(nodeInfo, null, 2)
            })
            onBackPress()
        } catch (err) {}

        setIsBusy(false)
    }

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
            title: I18n.t("SettingsSendReport_HeaderTitle")
        })
    }, [navigation])

    return (
        <View style={[styles.matchParent, { backgroundColor: focusBackgroundColor }]}>
            <View style={[styles.focusViewPanel, { backgroundColor }]}>
                <VStack space={5}>
                    <Text color={textColor} fontSize="lg">
                        {I18n.t("SettingsSendReport_Text")}
                    </Text>
                    <TextArea color={textColor} value={reportBody} onChangeText={onReportBodyChange} numberOfLines={20} />
                    <BusyButton isBusy={isBusy} onPress={onConfirmPress} isDisabled={isInvalid}>
                        {I18n.t("Button_Send")}
                    </BusyButton>
                </VStack>
            </View>
        </View>
    )
}

export default observer(SettingsSendReport)
