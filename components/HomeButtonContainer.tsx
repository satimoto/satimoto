import React from "react"
import { StyleSheet, View } from "react-native"
import { Button, IconButton } from "native-base"
import { QrCodeIcon } from "@bitcoin-design/bitcoin-icons-react-native/outline"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { HomeNavigationProp } from "screens/AppStack"
import { useNavigation } from "@react-navigation/native"

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        flexDirection: "row"
    },
    buttonSpacer: {
        width: "33%",
        justifyContent: "center"
    },
    button: {
        margin: 10
    },
    iconButtonSpacer: {
        width: "33%",
        flexDirection: "row",
        justifyContent: "center"
    }
})

const HomeButtonContainer = () => {
    const navigation = useNavigation<HomeNavigationProp>()
    const safeAreaInsets = useSafeAreaInsets()

    return (
        <View style={[{ bottom: safeAreaInsets.bottom, left: 10 + safeAreaInsets.left, right: 10 + safeAreaInsets.right }, styles.container]}>
            <View style={styles.buttonSpacer}>
                <Button borderRadius="3xl" size="lg" style={styles.button} onPress={() => navigation.navigate("Send")}>
                    Send
                </Button>
            </View>
            <View style={styles.iconButtonSpacer}>
                <IconButton
                    borderRadius="full"
                    size="lg"
                    variant="solid"
                    style={styles.button}
                    onPress={() => navigation.navigate("Send")}
                    icon={<QrCodeIcon />}
                    _icon={{ color: "#ffffff", size: 50 }}
                />
            </View>
            <View style={styles.buttonSpacer}>
                <Button borderRadius="3xl" size="lg" style={styles.button} onPress={() => navigation.navigate("Receive")}>
                    Receive
                </Button>
            </View>
        </View>
    )
}

export default HomeButtonContainer