import HeaderBackButton from "components/HeaderBackButton"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faDownload } from "@fortawesome/free-solid-svg-icons"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { observer } from "mobx-react"
import { IconButton, useTheme } from "native-base"
import React, { useCallback, useLayoutEffect } from "react"
import { BackHandler, StyleSheet, View } from "react-native"
import ReactNativeBlobUtil from "react-native-blob-util"
import Pdf from "react-native-pdf"
import { RouteProp, StackActions, useFocusEffect } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { IS_ANDROID } from "utils/constants"
import I18n from "utils/i18n"
import styles from "utils/styles"

const popAction = StackActions.pop()

const styleSheet = StyleSheet.create({
    pdf: {
        flex: 1
    }
})

type PdfViewerProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "PdfViewer">
    route: RouteProp<AppStackParamList, "PdfViewer">
}

const PdfViewer = ({ navigation, route }: PdfViewerProps) => {
    const { colors } = useTheme()
    const focusBackgroundColor = useColor(colors.dark[400], colors.warmGray[200])
    const navigationOptions = useNavigationOptions({ headerShown: true })

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
            title: route.params.title || I18n.t("PdfViewer_HeaderTitle"),
            headerRight: () => (
                <IconButton
                    colorScheme="muted"
                    variant="ghost"
                    p={0.5}
                    isDisabled={!route.params.downloadPath}
                    onPress={onDownloadPress}
                    icon={<FontAwesomeIcon icon={faDownload} />}
                    _icon={{ color: "#ffffff", size: 32 }}
                />
            )
        })
    }, [navigation])

    const onDownloadPress = useCallback(() => {
        const config = IS_ANDROID
            ? {
                  fileCache: false,
                  addAndroidDownloads: {
                      useDownloadManager: true,
                      notification: true,
                      path: route.params.downloadPath,
                      description: "Downloading Invoice"
                  }
              }
            : {
                  fileCache: false,
                  path: route.params.downloadPath
              }

        if (route.params.source.uri) {
            ReactNativeBlobUtil.config(config)
                .fetch("GET", route.params.source.uri, route.params.source.headers || {})
                .then((res) => {
                    setTimeout(() => {
                        if (IS_ANDROID) {
                            ReactNativeBlobUtil.android.actionViewIntent(res.path(), "application/pdf")
                        } else {
                            ReactNativeBlobUtil.ios.previewDocument(res.path())
                        }
                    }, 300)
                })
        }
    }, [route.params.source])

    return (
        <View style={[styles.matchParent, { backgroundColor: focusBackgroundColor }]}>
            <Pdf source={route.params.source} style={styleSheet.pdf} trustAllCerts={false} />
        </View>
    )
}

export default observer(PdfViewer)
