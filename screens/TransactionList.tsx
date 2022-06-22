import HeaderButton from "components/HeaderButton"
import TransactionButton from "components/TransactionButton"
import { faTimes } from "@fortawesome/free-solid-svg-icons"
import useColor from "hooks/useColor"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { TransactionModel } from "models/Transaction"
import { useTheme, VStack } from "native-base"
import React, { useLayoutEffect } from "react"
import { ScrollView } from "react-native"
import styles from "utils/styles"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"

type TransactionListProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "TransactionList">
}

const TransactionList = ({ navigation }: TransactionListProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const { transactionStore } = useStore()

    useLayoutEffect(() => {
        navigation.setOptions({
            title: "Transactions",
            headerRight: () => <HeaderButton icon={faTimes} onPress={() => transactionStore.clearTransactions()} />
        })
    }, [navigation])

    const onPress = (transaction: TransactionModel) => {}

    return (
        <ScrollView style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            <VStack space={3}>
                {transactionStore.transactions.map((transaction) => (
                    <TransactionButton key={transaction.identifier} transaction={transaction} onPress={onPress} />
                ))}
            </VStack>
        </ScrollView>
    )
}

export default observer(TransactionList)
