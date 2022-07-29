import { ApolloProvider } from "@apollo/client"
import { NativeBaseProvider } from "native-base"
import * as protobuf from "protobufjs"
import { StoreProvider } from "providers/StoreProvider"
import React, { useEffect } from "react"
import messaging from "@react-native-firebase/messaging"
import { SafeAreaProvider } from "react-native-safe-area-context"
import SplashScreen from "react-native-splash-screen"
import { NavigationContainer } from "@react-navigation/native"
import AppStack from "screens/AppStack"
import notificationMessageHandler from "services/NotificationService"
import client from "services/SatimotoService"
import store from "stores/Store"
import { API_URI, NETWORK } from "utils/build"
import { Log } from "utils/logging"
import { NativeBaseTheme } from "utils/theme"
import ConfettiProvider from "providers/ConfettiProvider"

global.process = require("../polyfills/process")
protobuf.util.toJSONOptions = { defaults: true }

const log = new Log("App")

log.debug(`Starting: Api Uri: ${API_URI}`)
log.debug(`Starting: Network: ${NETWORK}`)

const App = () => {
    useEffect(() => {
        store.settingStore.requestPushNotificationPermission()

        const unsubscribeMessages = messaging().onMessage(notificationMessageHandler)

        return () => {
            unsubscribeMessages()
        }
    }, [])

    useEffect(() => {
        SplashScreen.hide()
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
                            <NavigationContainer>
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
