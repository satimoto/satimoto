import CameraScanner from "components/CameraScanner"
import HeaderBackButton from "components/HeaderBackButton"
import React, { useEffect, useState } from "react"
import useColor from "hooks/useColor"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { Log } from "utils/logging"
import { Text, useColorModeValue, useTheme } from "native-base"
import { StyleSheet, View } from "react-native"
import { IS_ANDROID } from "utils/constants"
import I18n from "utils/i18n"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const log = new Log("Scanner")

const styleSheet = StyleSheet.create({
    headerButtonView: { 
        position: "absolute",
        top: 50,
        left: 12,
        alignItems: "center",
        justifyContent: "space-between",

    },
    errorText: {
        position: "absolute",
        alignItems: "center",
    }
})

type ScannerProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "Scanner">
}

const Scanner = ({ navigation }: ScannerProps) => {
    const { colors } = useTheme()
    const errorColor = useColorModeValue("error.300", "error.500")
    const textColor = useColor(colors.lightText, colors.darkText)
    const safeAreaInsets = useSafeAreaInsets()
    const { uiStore } = useStore()
    const [isActive, setIsActive] = useState(true)
    const [lastError, setLastError] = useState("")

    useEffect(() => {
        if (uiStore.lnUrlAuthParams) {
            navigation.navigate("Home")
        }
    }, [uiStore.lnUrlAuthParams])

    const onNotAuthorized = () => {
        navigation.goBack()
    }

    const onQrCode = async (qrCode: string) => {
        setIsActive(false)
        setLastError("")

        const valid = await uiStore.parseIntent(qrCode)

        if (!valid) {
            setLastError(I18n.t("Scanner_QrCodeError"))

            setTimeout(() => {
                setIsActive(true)
            }, 2000)
        }
    }

    return (
        <CameraScanner isActive={isActive} onNotAuthorized={onNotAuthorized} onQrCode={onQrCode}>
            {!IS_ANDROID && (
                <View style={styleSheet.headerButtonView}>
                    <HeaderBackButton tintColor={textColor} onPress={() => navigation.goBack()} />
                </View>
            )}
            {lastError.length > 0 && (
                <Text color={errorColor} fontSize="xl" style={[styleSheet.errorText, {bottom: safeAreaInsets.bottom}]}>
                    {lastError}
                </Text>
            )}
        </CameraScanner>
    )
}

export default observer(Scanner)
