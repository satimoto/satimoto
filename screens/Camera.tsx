import CameraScanner from "components/CameraScanner"
import HeaderBackButton from "components/HeaderBackButton"
import React, { useEffect, useState } from "react"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { Log } from "utils/logging"
import { Text, useColorModeValue, useTheme } from "native-base"
import { Dimensions, StyleSheet, View } from "react-native"
import { IS_ANDROID } from "utils/constants"
import useColor from "hooks/useColor"

const log = new Log("Camera")

const styleSheet = StyleSheet.create({
    headerButtonView: { paddingLeft: 12, paddingTop: 50 },
    errorView: {
        position: "absolute",
        top: Dimensions.get("window").height / 2 + Dimensions.get("window").width / 2,
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: "center"
    }
})

type CameraProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "Camera">
}

const Camera = ({ navigation }: CameraProps) => {
    const { colors } = useTheme()
    const errorColor = useColorModeValue("error.300", "error.500")
    const textColor = useColor(colors.lightText, colors.darkText)
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
            log.debug("Not a valid QR code")
            setIsActive(true)
        }
    }

    return (
        <CameraScanner isActive={isActive} onNotAuthorized={onNotAuthorized} onQrCode={onQrCode}>
            {!IS_ANDROID && (
                <View style={styleSheet.headerButtonView}>
                    <HeaderBackButton tintColor={textColor} onPress={() => navigation.goBack()} />
                </View>
            )}
            <View style={styleSheet.errorView}>
                {lastError.length > 0 && (
                    <Text color={errorColor} fontSize="xl" bold>
                        {lastError}
                    </Text>
                )}
            </View>
        </CameraScanner>
    )
}

export default observer(Camera)
