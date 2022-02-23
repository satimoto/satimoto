import React from "react"
import messaging from "@react-native-firebase/messaging"
import App from "screens/App"
import { store } from "stores/Store"
import { Log } from "utils/logging"

const log = new Log("HeadlessApp")

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    log.debug(`Background message received: ${store.lightningStore.blockHeight}`)
    log.debug(JSON.stringify(remoteMessage))
})

interface HeadlessAppProps {
    isHeadless: boolean
}

const HeadlessApp = ({ isHeadless }: HeadlessAppProps) => {
    if (isHeadless) {
        return null
    }

    return <App />
}

export default HeadlessApp
