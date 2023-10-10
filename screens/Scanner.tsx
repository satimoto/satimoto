import CameraScanner from "components/CameraScanner"
import HeaderBackButton from "components/HeaderBackButton"
import React, { useEffect, useState } from "react"
import useColor from "hooks/useColor"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { Text, useColorModeValue, useTheme } from "native-base"
import { StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { IS_ANDROID } from "utils/constants"
import I18n from "utils/i18n"
import { errorToString } from "utils/conversion"
import { CommonActions, StackActions } from "@react-navigation/native"

const replaceAction = StackActions.replace("TokenList")

const styleSheet = StyleSheet.create({
    headerButtonView: {
        position: "absolute",
        top: 50,
        left: 12,
        alignItems: "center",
        justifyContent: "space-between"
    },
    errorText: {
        position: "absolute",
        alignItems: "center",
        paddingVertical: 5,
        paddingHorizontal: 5,
        borderRadius: 5
    }
})

type ScannerProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "Scanner">
}

const Scanner = ({ navigation }: ScannerProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const errorColor = useColorModeValue("error.300", "error.500")
    const textColor = useColor(colors.lightText, colors.darkText)
    const safeAreaInsets = useSafeAreaInsets()
    const { uiStore } = useStore()
    const [isActive, setIsActive] = useState(true)
    const [isValid, setIsValid] = useState(true)
    const [lastError, setLastError] = useState("")

    useEffect(() => {
        if (uiStore.linkToken) {
            navigation.dispatch(replaceAction)
        }
    }, [uiStore.linkToken])

    useEffect(() => {
        setLastError("")
        setIsActive(true)
        setIsValid(true)
    }, [])

    const onNotAuthorized = () => {
        navigation.goBack()
    }

    const onQrCode = async (qrCode: string) => {
        setIsActive(false)
        setLastError("")

        try {
            const success = await uiStore.parseIntent(qrCode)

            if (success) {
                navigation.dispatch((state) => {
                    const routes = state.routes.filter((route) => route.name !== "Scanner")
        
                    return CommonActions.reset({ ...state, routes, index: routes.length - 1 })
                })
            }
        } catch (error) {
            setLastError(I18n.t(errorToString(error)))
            setIsValid(false)
        } finally {
            setTimeout(() => {
                setIsActive(true)
                setIsValid(true)
            }, 2000)
        }
    }

    return (
        <CameraScanner isActive={isActive} isValid={isValid} onNotAuthorized={onNotAuthorized} onQrCode={onQrCode}>
            {!IS_ANDROID && (
                <View style={styleSheet.headerButtonView}>
                    <HeaderBackButton tintColor={textColor} onPress={() => navigation.goBack()} />
                </View>
            )}
            {lastError.length > 0 && (
                <Text
                    color={errorColor}
                    fontSize="xl"
                    style={[styleSheet.errorText, { backgroundColor, top: safeAreaInsets.top + 10 }]}
                >
                    {lastError}
                </Text>
            )}
        </CameraScanner>
    )
}

export default observer(Scanner)
