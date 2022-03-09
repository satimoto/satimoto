import TouchableHighlightOptional from "components/TouchableHighlightOptional"
import React from "react"
import { GestureResponderEvent, StyleSheet } from "react-native"
import { TransactionModel } from "models/Transaction"
import { Box, HStack, Spacer, Text, VStack } from "native-base"
import SatoshiBalance from "components/SatoshiBalance"

const styleSheet = StyleSheet.create({
    TransactionListItem: {
        justifyContent: "center",
        alignItems: "center"
    }
})

interface TransactionListItemProps {
    transaction: TransactionModel
    onPress?: (transaction: TransactionModel, event: GestureResponderEvent) => void
}

const TransactionListItem = ({ transaction, onPress = () => {} }: TransactionListItemProps) => {
    const onItemPress = (event: GestureResponderEvent) => {
        onPress(transaction, event)
    }

    return (
        <TouchableHighlightOptional onPress={onItemPress}>
            <Box bg="gray.500" p={2} rounded={12}>
                <HStack alignItems="center" space={1}>
                    <VStack>
                        <Text color="white" fontSize="lg" fontWeight="bold">
                            {transaction.identifier?.substring(0, 16)}
                        </Text>
                    </VStack>
                    <Spacer />
                    <VStack>
                        <SatoshiBalance size={18} color={"#ffffff"} satoshis={parseInt(transaction.valueSat)} />
                        <SatoshiBalance size={16} color={"#d0d0d0"} satoshis={parseInt(transaction.feeSat)} />
                    </VStack>
                </HStack>
            </Box>
        </TouchableHighlightOptional>
    )
}

export default TransactionListItem
