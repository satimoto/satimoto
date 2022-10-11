import { ApolloProvider } from "@apollo/client"
import { NativeBaseProvider } from "native-base"
import * as protobuf from "protobufjs"
import { StoreProvider } from "providers/StoreProvider"
import React, { useEffect } from "react"
import messaging from "@react-native-firebase/messaging"
import RNBootSplash from "react-native-bootsplash"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { NavigationContainer } from "@react-navigation/native"
import AppStack from "screens/AppStack"
import notificationMessageHandler from "services/NotificationService"
import client from "services/SatimotoService"
import store from "stores/Store"
import { API_URI, MAPBOX_API_KEY, NETWORK } from "utils/build"
import { Log } from "utils/logging"
import { NativeBaseTheme } from "utils/theme"
import ConfettiProvider from "providers/ConfettiProvider"

global.process = require("../polyfills/process")
protobuf.util.toJSONOptions = { defaults: true }

const log = new Log("App")

log.debug(`Starting: Api Uri: ${API_URI}`)
log.debug(`Starting: Network: ${NETWORK}`)
log.debug(`Starting: Mapbox API key: ${MAPBOX_API_KEY}`)

const App = () => {
    useEffect(() => {
        store.settingStore.requestPushNotificationPermission()

        const unsubscribeMessages = messaging().onMessage(notificationMessageHandler)

        messaging().onNotificationOpenedApp((remoteMessage) => {
            log.debug(`onNotificationOpenedApp: ${JSON.stringify(remoteMessage)}`)
        })

        messaging()
            .getInitialNotification()
            .then((remoteMessage) => {
                if (remoteMessage) {
                    log.debug(`getInitialNotification: ${JSON.stringify(remoteMessage)}`)
                }
            })

        return () => {
            unsubscribeMessages()
        }
    }, [])

    return (
        <ApolloProvider client={client}>
            <ConfettiProvider
                count={300}
                colors={["#0099FF", "#3874ED", "#744CD8", "#957AE3", "#A12EC9", "#CC11BB"]}
                fallSpeed={5000}
                origin={{ x: 0, y: 0 }}
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

export default App
