import InvoiceButton from "components/InvoiceButton"
import PaymentButton from "components/PaymentButton"
import InvoiceModel from "models/Invoice"
import PaymentModel from "models/Payment"
import TransactionModel from "models/Transaction"
import React from "react"
import { GestureResponderEvent } from "react-native"

interface TransactionButtonItemProps {
    transaction: TransactionModel
    onPress?: (transaction: TransactionModel, event: GestureResponderEvent) => void
}

const TransactionButtonItem = ({ transaction, onPress = () => {} }: TransactionButtonItemProps) => {
    const onInvoicePress = (invoice: InvoiceModel, event: GestureResponderEvent) => {
        onPress(transaction, event)
    }

    const onPaymentPress = (payment: PaymentModel, event: GestureResponderEvent) => {
        onPress(transaction, event)
    }

    return (
        <>
            {transaction.invoice && <InvoiceButton invoice={transaction.invoice} onPress={onInvoicePress} />}
            {transaction.payment && <PaymentButton payment={transaction.payment} onPress={onPaymentPress} />}
        </>
    )
}

export default TransactionButtonItem
