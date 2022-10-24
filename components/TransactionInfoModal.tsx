import { observer } from "mobx-react"
import TransactionModel from "models/Transaction"
import React from "react"
import InvoiceInfoModal from "components/InvoiceInfoModal"
import PaymentInfoModal from "components/PaymentInfoModal"

interface TransactionInfoModalProps {
    transaction?: TransactionModel
    onClose: () => void
}

const TransactionInfoModal = ({ transaction, onClose }: TransactionInfoModalProps) => {
    return transaction ? (
        <>
            {transaction.invoice && <InvoiceInfoModal invoice={transaction.invoice} onClose={onClose} />}
            {transaction.payment && <PaymentInfoModal payment={transaction.payment} onClose={onClose} />}
        </>
    ) : (
        <></>
    )
}

export default observer(TransactionInfoModal)
