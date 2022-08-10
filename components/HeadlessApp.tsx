import React from "react"
import messaging from "@react-native-firebase/messaging"
import App from "screens/App"
import notificationMessageHandler from "services/NotificationService"

messaging().setBackgroundMessageHandler(notificationMessageHandler)

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
