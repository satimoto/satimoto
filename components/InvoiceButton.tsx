import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import SatoshiBalance from "components/SatoshiBalance"
import useColor from "hooks/useColor"
import InvoiceModel from "models/Invoice"
import { HStack, Spacer, Text, useTheme, VStack } from "native-base"
import React from "react"
import { GestureResponderEvent } from "react-native"
import TimeAgo from "react-native-timeago"
import styles from "utils/styles"

interface InvoiceButtonItemProps {
    invoice: InvoiceModel
    onPress?: (invoice: InvoiceModel, event: GestureResponderEvent) => void
}

const InvoiceButtonItem = ({ invoice, onPress = () => {} }: InvoiceButtonItemProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.gray[500], colors.warmGray[50])

    const onButtonPress = (event: GestureResponderEvent) => {
        onPress(invoice, event)
    }

    return (
        <TouchableOpacityOptional onPress={onButtonPress} style={[styles.transactionButton, { backgroundColor }]}>
            <HStack alignItems="center" space={1}>
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
            </HStack>
        </TouchableOpacityOptional>
    )
}

export default InvoiceButtonItem
