import ListButton from "components/ListButton"
import { faChevronRight } from "@fortawesome/free-solid-svg-icons"
import React, { useLayoutEffect } from "react"
import { observer } from "mobx-react"
import { useTheme, VStack } from "native-base"
import { ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import styles from "utils/styles"
import useColor from "hooks/useColor"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import I18n from "utils/i18n"

type SettingsLearnProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "SettingsLearn">
}

const SettingsLearn = ({ navigation }: SettingsLearnProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const safeAreaInsets = useSafeAreaInsets()

    const onBitcoinPress = () => {
        navigation.navigate("PdfViewer", {
            downloadPath: "https://satimoto.com/bitcoin.pdf",
            source: {
                uri: "https://satimoto.com/bitcoin.pdf",
                cache: true
            },
            title: I18n.t("SettingsLearn_BitcoinWhitepaperText")
        })
    }

    const onCypherpunkPress = () => {
        navigation.navigate("PdfViewer", {
            downloadPath: "https://satimoto.com/cypherpunks-manifesto.pdf",
            source: {
                uri: "https://satimoto.com/cypherpunks-manifesto.pdf",
                cache: true
            },
            title: I18n.t("SettingsLearn_CypherpunksManifestoText")
        })
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: I18n.t("SettingsLearn_HeaderTitle")
        })
    }, [navigation])

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            <ScrollView style={[styles.matchParent, { backgroundColor, borderRadius: 12, marginTop: 10 }]}>
                <VStack space={3} style={{ paddingBottom: safeAreaInsets.bottom }}>
                <ListButton
                        key="bitcoin"
                        title={I18n.t("SettingsLearn_BitcoinWhitepaperText")}
                        hint="Satoshi Nakamoto"
                        iconRight={faChevronRight}
                        onPress={onBitcoinPress}
                    />
                    <ListButton
                        key="cypherpunk"
                        title={I18n.t("SettingsLearn_CypherpunksManifestoText")}
                        hint="Eric Hughes"
                        iconRight={faChevronRight}
                        onPress={onCypherpunkPress}
                    />
                </VStack>
            </ScrollView>
        </View>
    )
}

export default observer(SettingsLearn)
