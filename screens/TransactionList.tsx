import TransactionListItem from "components/TransactionListItem"
import useColor from "hooks/useColor"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { TransactionModel } from "models/Transaction"
import { useTheme, VStack } from "native-base"
import React, { useLayoutEffect } from "react"
import { View } from "react-native"
import { TransactionListNavigationProp } from "screens/TransactionStack"
import styles from "utils/styles"

type TransactionListProps = {
    navigation: TransactionListNavigationProp
}

const TransactionList = ({ navigation }: TransactionListProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const { transactionStore } = useStore()

    useLayoutEffect(() => {
        navigation.setOptions({
            title: "Transactions"
        })
    }, [navigation])

    const onPress = (transaction: TransactionModel) => {}

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            <VStack space={3}>
                {transactionStore.transactions.map((transaction) => (
                    <TransactionListItem key={transaction.identifier} transaction={transaction} onPress={onPress} />
                ))}
            </VStack>
        </View>
    )
}

export default observer(TransactionList)
