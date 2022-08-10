import React from "react"
import { StyleSheet, View } from "react-native"
import { Button, IconButton } from "native-base"
import { QrCodeIcon } from "@bitcoin-design/bitcoin-icons-react-native/outline"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import I18n from "utils/i18n"

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

export type HomeFooterContainerEvent = "send" | "qr" | "receive"

interface HomeFooterContainerProps {
    onPress: (event: HomeFooterContainerEvent) => void
}

const HomeFooterContainer = ({ onPress }: HomeFooterContainerProps) => {
    const safeAreaInsets = useSafeAreaInsets()

    return (
        <View style={[{ bottom: safeAreaInsets.bottom, left: 10 + safeAreaInsets.left, right: 10 + safeAreaInsets.right }, styles.container]}>
            <View style={styles.buttonSpacer}>
                <Button borderRadius="3xl" size="lg" style={styles.button} onPress={() => onPress("send")}>
                    {I18n.t("HomeFooterContainer_ButtonSend")}
                </Button>
            </View>
            <View style={styles.iconButtonSpacer}>
                <IconButton
                    borderRadius="full"
                    size="lg"
                    variant="solid"
                    style={styles.button}
                    onPress={() => onPress("qr")}
                    icon={<QrCodeIcon />}
                    _icon={{ color: "#ffffff", size: 50 }}
                />
            </View>
            <View style={styles.buttonSpacer}>
                <Button borderRadius="3xl" size="lg" style={styles.button} onPress={() => onPress("receive")}>
                    {I18n.t("HomeFooterContainer_ButtonReceive")}
                </Button>
            </View>
        </View>
    )
}

export default HomeFooterContainer
