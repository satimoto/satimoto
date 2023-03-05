import AddressCard from "components/AddressCard"
import InvoiceRequestButton from "components/InvoiceRequestButton"
import SatoshiBalance from "components/SatoshiBalance"
import SessionInvoiceButton from "components/SessionInvoiceButton"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faFilePdf } from "@fortawesome/free-solid-svg-icons"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { useStore } from "hooks/useStore"
import Long from "long"
import { observer } from "mobx-react"
import { IconButton, useTheme, VStack } from "native-base"
import React, { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { BackHandler, Platform, ScrollView, View } from "react-native"
import ReactNativeBlobUtil from "react-native-blob-util"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { HeaderBackButton } from "@react-navigation/elements"
import { RouteProp, StackActions, useFocusEffect } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { API_URI } from "utils/build"
import { toSatoshi } from "utils/conversion"
import I18n from "utils/i18n"
import styles from "utils/styles"

const popAction = StackActions.pop()

type SessionDetailProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "SessionDetail">
    route: RouteProp<AppStackParamList, "SessionDetail">
}

const SessionDetail = ({ navigation, route }: SessionDetailProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const textColor = useColor(colors.lightText, colors.darkText)
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const safeAreaInsets = useSafeAreaInsets()
    const [session] = useState(route.params.session)
    const [total, setTotal] = useState(0)
    const { settingStore } = useStore()

    const onBackPress = useCallback((): boolean => {
        navigation.dispatch(popAction)
        return true
    }, [navigation])

    const onPdfPress = useCallback(() => {
        const accessToken = settingStore.accessToken
        const {
            dirs: { DownloadDir, DocumentDir }
        } = ReactNativeBlobUtil.fs
        const platformPath = Platform.select({ ios: DocumentDir, android: DownloadDir })

        if (accessToken) {
            navigation.navigate("PdfViewer", {
                downloadPath: `${platformPath}/${session.uid}.pdf`,
                source: {
                    uri: `${API_URI}/v1/pdf/invoice/${session.uid}`,
                    headers: { Authorization: `Bearer ${accessToken}` },
                    cache: false
                },
                title: I18n.t("PdfViewer_InvoiceTitle")
            })
        }
    }, [settingStore.accessToken, session.uid])

    useEffect(() => {
        const { sessionInvoices } = session

        if (sessionInvoices) {
            const totalMsat = sessionInvoices.reduce((totalMsat, sessionInvoice) => {
                return totalMsat.add(sessionInvoice.totalMsat)
            }, new Long(0))

            setTotal(toSatoshi(totalMsat).toNumber())
        }
    }, [session.sessionInvoices])

    useFocusEffect(
        useCallback(() => {
            const backEventListener = BackHandler.addEventListener("hardwareBackPress", onBackPress)
            return () => backEventListener.remove()
        }, [navigation])
    )

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => <HeaderBackButton tintColor={navigationOptions.headerTintColor} onPress={onBackPress} />,
            title: I18n.t("SessionDetail_HeaderTitle"),
            headerRight: () => (
                <IconButton
                    colorScheme="muted"
                    variant="ghost"
                    p={0.5}
                    onPress={onPdfPress}
                    icon={<FontAwesomeIcon icon={faFilePdf} />}
                    _icon={{ color: "#ffffff", size: 32 }}
                />
            )
        })
    }, [navigation])

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            {session.location && (
                <AddressCard
                    name={session.location.name}
                    address={session.location.address}
                    city={session.location.city}
                    postalCode={session.location.postalCode}
                    alignItems="center"
                />
            )}
            <VStack space={2} alignContent="flex-start" marginTop={5} marginBottom={2}>
                <View style={{ backgroundColor, alignItems: "center" }}>
                    <SatoshiBalance size={36} color={textColor} satoshis={total} />
                </View>
            </VStack>
            <ScrollView style={[styles.matchParent, { backgroundColor, borderRadius: 12, marginTop: 10 }]}>
                <VStack space={3} style={{ paddingBottom: safeAreaInsets.bottom }}>
                    {session.invoiceRequest && <InvoiceRequestButton key={session.invoiceRequest.id} invoiceRequest={session.invoiceRequest} />}
                    {session.sessionInvoices &&
                        session.sessionInvoices.map((sessionInvoice) => (
                            <SessionInvoiceButton key={sessionInvoice.id} sessionInvoice={sessionInvoice} />
                        ))}
                </VStack>
            </ScrollView>
        </View>
    )
}

export default observer(SessionDetail)
