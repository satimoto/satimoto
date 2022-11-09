import { Linking } from "react-native"
import { IS_ANDROID } from "utils/constants"

const launchRouteIntent = (latitude: number, longitude: number) => {
    if (IS_ANDROID) {
        Linking.openURL(`google.navigation:q=${latitude}+${longitude}&mode=d`)
    } else {
        Linking.openURL(`maps://app?daddr=${latitude}+${longitude}&dirflg=d`)
    }
}

export { launchRouteIntent }