import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import SatoshiBalance from "components/SatoshiBalance"
import useColor from "hooks/useColor"
import InvoiceModel from "models/Invoice"
import PaymentModel from "models/Payment"
import TransactionModel from "models/Transaction"
import { HStack, Spacer, Text, useTheme, VStack } from "native-base"
import React from "react"
import { GestureResponderEvent, StyleSheet } from "react-native"
import TimeAgo from "react-native-timeago"

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

    const renderInvoice = (invoice: InvoiceModel) => {
        return (
            <>
                <VStack>
                    <Text color="white" fontSize="lg" fontWeight="bold">
                        {invoice.hash.substring(0, 16)}
                    </Text>
                    <Text color="gray.300" fontSize="lg">
                        <TimeAgo time={invoice.createdAt} />
                    </Text>
                </VStack>
                <Spacer />
                <VStack alignItems="flex-end">
                    <SatoshiBalance size={18} color={"#ffffff"} satoshis={parseInt(invoice.valueSat)} />
                </VStack>
            </>
        )
    }

    const renderPayment = (payment: PaymentModel) => {
        return (
            <>
                <VStack>
                    <Text color="white" fontSize="lg" fontWeight="bold">
                        {payment.hash.substring(0, 16)}
                    </Text>
                    <Text color="gray.300" fontSize="lg">
                        <TimeAgo time={payment.createdAt} />
                    </Text>
                </VStack>
                <Spacer />
                <VStack alignItems="flex-end">
                    <SatoshiBalance size={18} color={"#ffffff"} satoshis={parseInt(payment.valueSat)} />
                    <SatoshiBalance size={16} color={"#d0d0d0"} satoshis={parseInt(payment.feeSat)} prependText="FEE" />
                </VStack>
            </>
        )
    }

    const onItemPress = (event: GestureResponderEvent) => {
        onPress(transaction, event)
    }

    return (
        <TouchableOpacityOptional onPress={onItemPress} style={[styleSheet.touchableOpacity, { backgroundColor }]}>
            <HStack alignItems="center" space={1}>
                {transaction.invoice && renderInvoice(transaction.invoice)}
                {transaction.payment && renderPayment(transaction.payment)}
            </HStack>
        </TouchableOpacityOptional>
    )
}

export default TransactionButtonItem
