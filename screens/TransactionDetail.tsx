import React, { useLayoutEffect } from "react"
import { observer } from "mobx-react"
import { View } from "react-native"
import { useTheme, VStack } from "native-base"
import styles from "utils/styles"
import useColor from "hooks/useColor"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import I18n from "utils/i18n"

type TransactionDetailProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "TransactionDetail">
}

const TransactionDetail = ({ navigation }: TransactionDetailProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: I18n.t("TransactionDetail_HeaderTitle"),
        })
    }, [navigation])

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            <VStack space={2}>
                
            </VStack>
        </View>
    )
}

export default observer(TransactionDetail)
