import RoundedButton from "components/RoundedButton"
import { observer } from "mobx-react"
import React from "react"
import { StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import I18n from "utils/i18n"
import { useStore } from "hooks/useStore"
import CircularProgressButton from "components/CircularProgressButton"

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
    const { lightningStore } = useStore()

    return (
        <View style={[{ bottom: safeAreaInsets.bottom, left: 10 + safeAreaInsets.left, right: 10 + safeAreaInsets.right }, styles.container]}>
            <View style={styles.buttonSpacer}>
                <RoundedButton isDisabled={!lightningStore.syncedToChain} onPress={() => onPress("send")} style={styles.button}>
                    {I18n.t("Button_Send")}
                </RoundedButton>
            </View>
            <View style={styles.iconButtonSpacer}>
                <CircularProgressButton
                    isBusy={!lightningStore.syncedToChain}
                    value={lightningStore.percentSynced}
                    onPress={() => onPress("qr")}
                    style={styles.button}
                />
            </View>
            <View style={styles.buttonSpacer}>
                <RoundedButton
                    isDisabled={!lightningStore.syncedToChain}
                    onPress={() => onPress("receive")}
                    style={styles.button}
                >
                    {I18n.t("Button_Receive")}
                </RoundedButton>
            </View>
        </View>
    )
}

export default observer(HomeFooterContainer)
