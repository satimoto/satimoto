import React from "react"
import { FileLogger } from "react-native-file-logger"
import messaging from "@react-native-firebase/messaging"
import BackgroundApp from "screens/BackgroundApp"
import ForegroundApp from "screens/ForegroundApp"
import notificationMessageHandler from "services/notification"
import { DEBUG } from "utils/build"

FileLogger.configure({
    captureConsole: false,
    maximumNumberOfFiles: DEBUG ? 20 : 5
})

messaging().setBackgroundMessageHandler(notificationMessageHandler)

interface AppProps {
    isHeadless: boolean
}

const App = ({ isHeadless }: AppProps) => {
    if (isHeadless) {
        return <BackgroundApp />
    }

    return <ForegroundApp />
}

export default App
