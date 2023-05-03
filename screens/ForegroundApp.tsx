import { ApolloProvider } from "@apollo/client"
import { Buffer } from "buffer"
import { observer } from "mobx-react"
import moment from "moment"
import { NativeBaseProvider } from "native-base"
import * as protobuf from "protobufjs"
import ConfettiProvider from "providers/ConfettiProvider"
import { StoreProvider } from "providers/StoreProvider"
import React, { useEffect } from "react"
import messaging from "@react-native-firebase/messaging"
import BackgroundFetch from "react-native-background-fetch"
import RNBootSplash from "react-native-bootsplash"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { NavigationContainer } from "@react-navigation/native"
import AppStack from "screens/AppStack"
import notificationMessageHandler from "services/notification"
import client from "services/satimoto"
import store from "stores/Store"
import { backgroundEvent, backgroundTimeout, BACKGROUND_FETCH_CONFIG } from "utils/background"
import { API_URI, APPLICATION_ID, MAPBOX_API_KEY, NETWORK, VERSION_CODE, VERSION_NAME } from "utils/build"
import { Log } from "utils/logging"
import { NativeBaseTheme } from "utils/theme"
import "moment/locale/en-gb"

global.Buffer = Buffer
global.process = require("../polyfills/process")
moment().locale("en-gb")
protobuf.util.toJSONOptions = { defaults: true }

const log = new Log("ForegroundApp")

log.debug(`SAT001: Starting: Bundle ID: ${APPLICATION_ID}`, true)
log.debug(`SAT001: Starting: Version: ${VERSION_NAME} (${VERSION_CODE})`, true)
log.debug(`SAT001: Starting: Api Uri: ${API_URI}`, true)
log.debug(`SAT001: Starting: Network: ${NETWORK}`, true)
log.debug(`SAT001: Starting: Mapbox API key: ${MAPBOX_API_KEY}`)

const ForegroundApp = () => {
    useEffect(() => {
        if (store.settingStore.pushNotificationEnabled) {
            log.debug(`SAT002: Initialize push notification handling`, true)
            const unsubscribeMessages = messaging().onMessage(notificationMessageHandler)

            const unsubscribeTokenRefresh = messaging().onTokenRefresh((token) => {
                store.settingStore.setPushNotificationSettings(token.length > 0, token)
            })

            const unsubscribeOpenedApp = messaging().onNotificationOpenedApp((remoteMessage) => {
                log.debug(`SAT003 onNotificationOpenedApp: ${JSON.stringify(remoteMessage)}`, true)
            })

            messaging()
                .getInitialNotification()
                .then((remoteMessage) => {
                    if (remoteMessage) {
                        log.debug(`SAT004 getInitialNotification: ${JSON.stringify(remoteMessage)}`, true)
                    }
                })

            return () => {
                unsubscribeMessages()
                unsubscribeTokenRefresh()
                unsubscribeOpenedApp()
            }
        }
    }, [store.settingStore.pushNotificationEnabled])

    useEffect(() => {
        BackgroundFetch.configure(BACKGROUND_FETCH_CONFIG, backgroundEvent, backgroundTimeout)
    }, [])

    return (
        <ApolloProvider client={client}>
            <ConfettiProvider
                count={128}
                size={32}
                colors={["#0099FF", "#3874ED", "#744CD8", "#957AE3", "#A12EC9", "#CC11BB"]}
                fallSpeed={5000}
                origin={{ x: -30, y: 0 }}
            >
                <NativeBaseProvider theme={NativeBaseTheme}>
                    <SafeAreaProvider>
                        <StoreProvider store={store}>
                            <NavigationContainer onReady={() => RNBootSplash.hide({ fade: true })}>
                                <AppStack />
                            </NavigationContainer>
                        </StoreProvider>
                    </SafeAreaProvider>
                </NativeBaseProvider>
            </ConfettiProvider>
        </ApolloProvider>
    )
}

export default observer(ForegroundApp)
