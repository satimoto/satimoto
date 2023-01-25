import BusyButton from "components/BusyButton"
import HeaderBackButton from "components/HeaderBackButton"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { observer } from "mobx-react"
import { Text, TextArea, useColorModeValue, useTheme, VStack } from "native-base"
import React, { useCallback, useLayoutEffect, useState } from "react"
import { BackHandler, Platform, View } from "react-native"
import { FileLogger } from "react-native-file-logger"
import { RouteProp, StackActions, useFocusEffect } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { getInfo } from "services/LightningService"
import I18n from "utils/i18n"
import { Log } from "utils/logging"
import styles from "utils/styles"
import { APPLICATION_VERSION } from "utils/constants"

const popAction = StackActions.pop()
const log = new Log("SendReport")

type SendReportProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "SendReport">
    route: RouteProp<AppStackParamList, "SendReport">
}

const SendReport = ({ navigation, route }: SendReportProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const focusBackgroundColor = useColor(colors.dark[400], colors.warmGray[200])
    const textColor = useColorModeValue("lightText", "darkText")
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const [isBusy, setIsBusy] = useState(false)
    const [isInvalid, setIsInvalid] = useState(true)
    const [reportBody, setReportBody] = useState("")

    const onReportBodyChange = (text: string) => {
        setReportBody(text)
        setIsInvalid(reportBody.length === 0)
    }

    const onConfirmPress = async () => {
        setIsBusy(true)

        try {
            const getInfoResponse = await getInfo()

            await FileLogger.sendLogFilesByEmail({
                to: "hello@satimoto.com",
                subject: "Issue Report",
                body:
                    `OS: ${Platform.OS} - ${Platform.Version}\n` +
                    `Version: ${APPLICATION_VERSION}\n` +
                    `\n` +
                    `${reportBody}` +
                    `\n\n` +
                    JSON.stringify(getInfoResponse.toJSON(), null, 2)
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
            title: I18n.t("SendReport_HeaderTitle")
        })
    }, [navigation])

    return (
        <View style={[styles.matchParent, { backgroundColor: focusBackgroundColor }]}>
            <View style={[styles.focusViewPanel, { backgroundColor }]}>
                <VStack space={5}>
                    <Text color={textColor} fontSize="lg">
                        {I18n.t("SendReport_Text")}
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

export default observer(SendReport)
