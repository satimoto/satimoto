import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import React from "react"
import { GestureResponderEvent, StyleSheet } from "react-native"
import TimeAgo from "react-native-timeago"
import { TransactionModel } from "models/Transaction"
import { HStack, Spacer, Text, useTheme, VStack } from "native-base"
import SatoshiBalance from "components/SatoshiBalance"
import useColor from "hooks/useColor"

const styleSheet = StyleSheet.create({
    touchableOpacity: {
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 12
    }
})

interface TransactionButtonItemProps {
    transaction: TransactionModel
    onPress?: (transaction: TransactionModel, event: GestureResponderEvent) => void
}

const TransactionButtonItem = ({ transaction, onPress = () => {} }: TransactionButtonItemProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.gray[500], colors.warmGray[50])

    const onItemPress = (event: GestureResponderEvent) => {
        onPress(transaction, event)
    }

    return (
        <TouchableOpacityOptional onPress={onItemPress} style={[styleSheet.touchableOpacity, { backgroundColor }]}>
            <HStack alignItems="center" space={1}>
                <VStack>
                    <Text color="white" fontSize="lg" fontWeight="bold">
                        {transaction.identifier?.substring(0, 16)}
                    </Text>
                    <Text color="gray.300" fontSize="lg">
                        {transaction.createdAt && <TimeAgo time={transaction.createdAt} />}
                    </Text>
                </VStack>
                <Spacer />
                <VStack alignItems="flex-end">
                    <SatoshiBalance size={18} color={"#ffffff"} satoshis={parseInt(transaction.valueSat)} />
                    <SatoshiBalance size={16} color={"#d0d0d0"} satoshis={parseInt(transaction.feeSat)} prependText="FEE" />
                </VStack>
            </HStack>
        </TouchableOpacityOptional>
    )
}

export default TransactionButtonItem
