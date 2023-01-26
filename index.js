import { AppRegistry } from "react-native"
import App from "./screens/App"
import { name as appName } from "./app.json"
import BackgroundFetch from "react-native-background-fetch"
import { backgroundEvent } from "utils/background"

AppRegistry.registerComponent(appName, () => App)

BackgroundFetch.registerHeadlessTask(async ({ taskId }) => {
    await backgroundEvent(taskId)
})
