import React from "react"
import BackgroundFetch from "react-native-background-fetch"
import { backgroundEvent } from "utils/background"

BackgroundFetch.registerHeadlessTask(async ({ taskId }) => {
    await backgroundEvent(taskId)
})

const BackgroundApp = () => {
    return null
}

export default BackgroundApp
