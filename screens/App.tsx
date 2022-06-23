import AppStack from "screens/AppStack"
import { ApolloProvider } from "@apollo/client"
import { NativeBaseProvider } from "native-base"
import * as protobuf from "protobufjs"
import React, { useEffect } from "react"
import { AppState, AppStateStatus } from "react-native"
import messaging from "@react-native-firebase/messaging"
import { SafeAreaProvider } from "react-native-safe-area-context"
import client from "services/SatimotoService"
import store from "stores/Store"
import SplashScreen from "react-native-splash-screen"
import { API_URI, NETWORK } from "utils/build"
import { Log } from "utils/logging"
import { NativeBaseTheme } from "utils/theme"
import { NavigationContainer } from "@react-navigation/native"
import { StoreProvider } from "providers/StoreProvider"

global.process = require("../polyfills/process")
protobuf.util.toJSONOptions = { defaults: true }

const log = new Log("App")

log.debug(`Starting: Api Uri: ${API_URI}`)
log.debug(`Starting: Network: ${NETWORK}`)

const App = () => {
    const appStateChanged = (state: AppStateStatus) => {
        log.debug(`App state changed: ${state}`)
    }

    useEffect(() => {
        store.settingStore.requestPushNotificationPermission()

        const unsubscribeMessages = messaging().onMessage(async (remoteMessage) => {
            log.debug(`Message received: ${store.lightningStore.blockHeight}`)
            log.debug(JSON.stringify(remoteMessage))
        })

        return () => {
            unsubscribeMessages()
        }
    }, [])

    useEffect(() => {
        AppState.addEventListener("change", appStateChanged)

        return () => {
            AppState.removeEventListener("change", appStateChanged)
        }
    }, [])

    useEffect(() => {
        SplashScreen.hide()
    }, [])

    return (
        <ApolloProvider client={client}>
            <NativeBaseProvider theme={NativeBaseTheme}>
                <SafeAreaProvider>
                    <StoreProvider store={store}>
                        <NavigationContainer>
                            <AppStack />
                        </NavigationContainer>
                    </StoreProvider>
                </SafeAreaProvider>
            </NativeBaseProvider>
        </ApolloProvider>
    )
}

export default App
