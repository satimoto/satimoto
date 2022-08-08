import ButtonIcon from "components/ButtonIcon"
import PaymentBadge from "components/PaymentBadge"
import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import SatoshiBalance from "components/SatoshiBalance"
import useColor from "hooks/useColor"
import PaymentModel from "models/Payment"
import { HStack, Spacer, Text, useTheme, VStack } from "native-base"
import React from "react"
import { GestureResponderEvent } from "react-native"
import TimeAgo from "react-native-timeago"
import { transactionIcons } from "utils/assets"
import styles from "utils/styles"

interface PaymentButtonItemProps {
    payment: PaymentModel
    onPress?: (payment: PaymentModel, event: GestureResponderEvent) => void
}

const PaymentButtonItem = ({ payment, onPress = () => {} }: PaymentButtonItemProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.gray[500], colors.warmGray[50])

    const onButtonPress = (event: GestureResponderEvent) => {
        onPress(payment, event)
    }

    return (
        <TouchableOpacityOptional onPress={onButtonPress} style={[styles.transactionButton, { backgroundColor }]}>
            <HStack alignItems="center" space={1}>
                <ButtonIcon source={transactionIcons["MINUS"]} style={[styles.buttonIcon, {paddingHorizontal: 6}]}>
                     <PaymentBadge payment={payment} />
                </ButtonIcon>
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
            </HStack>
        </TouchableOpacityOptional>
    )
}

export default PaymentButtonItem
