import ClearTransactionsModal from "components/ClearTransactionsModal"
import HeaderButton from "components/HeaderButton"
import TransactionButton from "components/TransactionButton"
import TransactionInfoModal from "components/TransactionInfoModal"
import { faTimes } from "@fortawesome/free-solid-svg-icons"
import useColor from "hooks/useColor"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import TransactionModel from "models/Transaction"
import { useTheme, VStack } from "native-base"
import React, { useLayoutEffect, useState } from "react"
import { ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import styles from "utils/styles"
import I18n from "utils/i18n"

type SettingsPaymentsProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "SettingsPayments">
}

const SettingsPayments = ({ navigation }: SettingsPaymentsProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const safeAreaInsets = useSafeAreaInsets()
    const [shownTransaction, setShownTransaction] = useState<TransactionModel>()
    const [clearTransactionsModalShown, setClearTransactionsModalShown] = useState(false)
    const { transactionStore } = useStore()

    useLayoutEffect(() => {
        navigation.setOptions({
            title: I18n.t("SettingsPayments_HeaderTitle"),
            headerRight: () => <HeaderButton icon={faTimes} onPress={() => setClearTransactionsModalShown(true)} />
        })
    }, [navigation])

    const onTransactionPress = (transaction: TransactionModel) => {
        setShownTransaction(transaction)
    }

    return (
        <View style={styles.matchParent}>
            <ScrollView style={[styles.matchParent, { padding: 10, backgroundColor }]}>
                <VStack space={3} style={{ paddingBottom: safeAreaInsets.bottom }}>
                    {transactionStore.transactions.map((transaction) => (
                        <TransactionButton key={transaction.hash} transaction={transaction} onPress={onTransactionPress} />
                    ))}
                </VStack>
            </ScrollView>
            <ClearTransactionsModal isVisible={clearTransactionsModalShown} onClose={() => setClearTransactionsModalShown(false)} />
            <TransactionInfoModal transaction={shownTransaction} onClose={() => setShownTransaction(undefined)} />
        </View>
    )
}

export default observer(SettingsPayments)
