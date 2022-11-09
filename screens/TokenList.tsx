import HeaderButton from "components/HeaderButton"
import ScanNfcModal from "components/ScanNfcModal"
import TokenButton from "components/TokenButton"
import { faPlus } from "@fortawesome/free-solid-svg-icons"
import useColor from "hooks/useColor"
import { observer } from "mobx-react"
import TokenModel from "models/Token"
import { Text, useColorModeValue, useTheme, VStack } from "native-base"
import React, { useEffect, useLayoutEffect, useState } from "react"
import { ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { TagEvent } from "react-native-nfc-manager"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { createToken, listTokens } from "services/SatimotoService"
import I18n from "utils/i18n"
import styles from "utils/styles"

type TokenListProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "TokenList">
}

const TokenList = ({ navigation }: TokenListProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const textColor = useColorModeValue("lightText", "darkText")
    const safeAreaInsets = useSafeAreaInsets()
    const [tokens, setTokens] = useState<TokenModel[]>([])
    const [isBusy, setIsBusy] = useState(true)
    const [isScanNfcModalVisible, setIsScanNfcModalVisible] = useState(false)

    const onNfcTag = async (nfcTag: TagEvent) => {
        if (nfcTag.id) {
            const tokenResponse = await createToken({ uid: nfcTag.id })

            setTokens(tokens.concat([tokenResponse.data.createToken as TokenModel]))
        }
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            title: I18n.t("TokenList_HeaderTitle"),
            headerRight: () => <HeaderButton icon={faPlus} onPress={() => setIsScanNfcModalVisible(true)} />
        })
    }, [navigation])

    useEffect(() => {
        const asyncListTokens = async () => {
            const listTokensResponse = await listTokens()

            setTokens(listTokensResponse.data.listTokens as TokenModel[])
            setIsBusy(false)
        }

        asyncListTokens()
    }, [])

    const onPress = (token: TokenModel) => {}

    return (
        <View style={styles.matchParent}>
            {tokens.length > 0 ? (
                <ScrollView style={[styles.matchParent, { padding: 10, backgroundColor }]}>
                    <VStack space={3} style={{ paddingBottom: safeAreaInsets.bottom }}>
                        {tokens.map((token) => (
                            <TokenButton key={token.uid} token={token} onPress={onPress} />
                        ))}
                    </VStack>
                </ScrollView>
            ) : (
                <View style={[{ height: "100%", backgroundColor }, styles.center]}>
                    <Text color={textColor} bold fontSize={16} textAlign="center">
                        {I18n.t("TokenList_EmptyInfoTitle")}
                    </Text>
                    <Text color={textColor}>({I18n.t("TokenList_EmptyInfoSubtitle")})</Text>
                </View>
            )}
            <ScanNfcModal isVisible={isScanNfcModalVisible} onNfcTag={onNfcTag} onClose={() => setIsScanNfcModalVisible(false)} />
        </View>
    )
}

export default observer(TokenList)
