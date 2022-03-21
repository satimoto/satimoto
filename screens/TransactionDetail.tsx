import React, { useLayoutEffect } from "react"
import { observer } from "mobx-react"
import { View } from "react-native"
import { useTheme, VStack } from "native-base"
import styles from "utils/styles"
import useColor from "hooks/useColor"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"

type TransactionListProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "TransactionList">
}

const TransactionList = ({ navigation }: TransactionListProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: "Transactions",
        })
    }, [navigation])

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            <VStack space={2}>
                
            </VStack>
        </View>
    )
}

export default observer(TransactionList)
