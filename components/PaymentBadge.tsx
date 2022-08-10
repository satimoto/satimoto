import IconBadge from "components/IconBadge"
import usePaymentStatusIcon from "hooks/usePaymentStatusIcon"
import PaymentModel from "models/Payment"
import React from "react"

interface PaymentBadgeProps {
    payment: PaymentModel
}

const PaymentBadge = ({ payment }: PaymentBadgeProps) => {
    const [icon, color] = usePaymentStatusIcon(payment.status)

    return <IconBadge icon={icon} color={color} />
}

export default PaymentBadge
