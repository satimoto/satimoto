import ConfirmationModal from "components/ConfirmationModal"
import HeaderButton from "components/HeaderButton"
import ScanNfcModal from "components/ScanNfcModal"
import TokenButton from "components/TokenButton"
import TokensInfoModal from "components/TokensInfoModal"
import { faPlus } from "@fortawesome/free-solid-svg-icons"
import useColor from "hooks/useColor"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import TokenModel from "models/Token"
import { Text, useColorModeValue, useTheme, VStack } from "native-base"
import React, { useEffect, useLayoutEffect, useState } from "react"
import { ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { TagEvent } from "react-native-nfc-manager"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { createToken, listTokens } from "services/satimoto"
import { IS_ANDROID } from "utils/constants"
import I18n from "utils/i18n"
import styles from "utils/styles"

type SettingsTokensProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "SettingsTokens">
}

const SettingsTokens = ({ navigation }: SettingsTokensProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const textColor = useColorModeValue("lightText", "darkText")
    const safeAreaInsets = useSafeAreaInsets()
    const [tokens, setTokens] = useState<TokenModel[]>([])
    const [isAboutModalVisible, setIsAboutModalVisible] = useState(false)
    const [isLinkTokenModalVisible, setIsLinkTokenModalVisible] = useState(false)
    const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false)
    const [isScanNfcModalVisible, setIsScanNfcModalVisible] = useState(false)
    const { settingStore, uiStore } = useStore()

    const onAddButtonPress = async () => {
        const notificationsEnabled = await settingStore.requestPushNotificationPermission()

        if (notificationsEnabled) {
            setIsScanNfcModalVisible(true)
        } else {
            setIsNotificationModalVisible(true)
        }
    }

    const onAboutModalPress = async (): Promise<void> => {
        uiStore.setTooltipShown({ cards: true })
        setIsAboutModalVisible(false)
    }

    const onLinkTokenPress = async (): Promise<void> => {
        if (uiStore.linkToken) {
            const tokenResponse = await createToken({ uid: uiStore.linkToken })

            setTokens(tokens.concat([tokenResponse.data.createToken as TokenModel]))
            setIsLinkTokenModalVisible(false)
            uiStore.setLinkToken(undefined)
        }
    }

    const onTokenPress = (token: TokenModel) => {}

    const onNfcTag = async (nfcTag: TagEvent) => {
        if (nfcTag.id) {
            const tokenResponse = await createToken({ uid: nfcTag.id })

            setTokens(tokens.concat([tokenResponse.data.createToken as TokenModel]))
        }
    }

    const renderHeaderRight = () => {
        return IS_ANDROID && uiStore.nfcAvailable ? <HeaderButton icon={faPlus} onPress={onAddButtonPress} /> : undefined
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            title: I18n.t("SettingsTokens_HeaderTitle"),
            headerRight: renderHeaderRight
        })
    }, [navigation])

    useEffect(() => {
        if (uiStore.linkToken) {
            setIsLinkTokenModalVisible(true)
        } else {
            setIsLinkTokenModalVisible(false)
        }
    }, [uiStore.linkToken])

    useEffect(() => {
        if (!uiStore.tooltipShownCards) {
            setIsAboutModalVisible(true)
        }

        const asyncListTokens = async () => {
            const listTokensResponse = await listTokens()

            setTokens(listTokensResponse.data.listTokens as TokenModel[])
        }

        asyncListTokens()
    }, [])

    return (
        <View style={styles.matchParent}>
            {tokens.length > 0 ? (
                <ScrollView style={[styles.matchParent, { padding: 10, backgroundColor }]}>
                    <VStack space={3} style={{ paddingBottom: safeAreaInsets.bottom }}>
                        {tokens.map((token) => (
                            <TokenButton key={token.uid} token={token} onPress={onTokenPress} />
                        ))}
                    </VStack>
                </ScrollView>
            ) : (
                <View style={[{ height: "100%", backgroundColor, padding: 5 }, styles.center]}>
                    <Text color={textColor} bold fontSize={16} textAlign="center" paddingTop={5}>
                        {I18n.t(IS_ANDROID ? "SettingsTokens_EmptyInfoTitle" : "SettingsTokens_EmptyInfoIOSTitle")}
                    </Text>
                    {IS_ANDROID && <Text color={textColor}>({I18n.t("SettingsTokens_EmptyInfoSubtitle")})</Text>}
                </View>
            )}
            <TokensInfoModal isVisible={isAboutModalVisible} onPress={onAboutModalPress} onClose={() => setIsAboutModalVisible(false)} />
            <ConfirmationModal
                isVisible={isLinkTokenModalVisible}
                text={I18n.t("ConfirmationModal_LinkTokenText", { token: uiStore.linkToken })}
                buttonText={I18n.t("Button_Ok")}
                onPress={onLinkTokenPress}
                onClose={() => uiStore.setLinkToken(undefined)}
            />
            <ConfirmationModal
                isVisible={isNotificationModalVisible}
                text={I18n.t("ConfirmationModal_NotificationText")}
                textSize="lg"
                subtext={I18n.t("ConfirmationModal_NotificationSubtext")}
                buttonText={I18n.t("Button_Ok")}
                onPress={async () => await setIsNotificationModalVisible(false)}
                onClose={() => setIsNotificationModalVisible(false)}
            />
            <ScanNfcModal isVisible={isScanNfcModalVisible} onNfcTag={onNfcTag} onClose={() => setIsScanNfcModalVisible(false)} />
        </View>
    )
}

export default observer(SettingsTokens)
