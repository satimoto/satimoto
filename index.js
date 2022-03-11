import "react-native-reanimated"
import "react-native-gesture-handler"
import { AppRegistry } from "react-native"
import HeadlessApp from "components/HeadlessApp"
import { name as appName } from "./app.json"

AppRegistry.registerComponent(appName, () => HeadlessApp)
