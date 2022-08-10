import IconBadge from "components/IconBadge"
import useInvoiceStatusIcon from "hooks/useInvoiceStatusIcon"
import InvoiceModel from "models/Invoice"
import React from "react"

interface InvoiceBadgeProps {
    invoice: InvoiceModel
}

const InvoiceBadge = ({ invoice }: InvoiceBadgeProps) => {
    const [icon, color] = useInvoiceStatusIcon(invoice.status)

    return <IconBadge icon={icon} color={color} />
}

export default InvoiceBadge
