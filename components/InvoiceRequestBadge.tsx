import IconBadge from "components/IconBadge"
import useInvoiceRequestIcon from "hooks/useInvoiceRequestIcon"
import InvoiceRequestModel from "models/InvoiceRequest"
import React from "react"

interface InvoiceRequestBadgeProps {
    invoiceRequest: InvoiceRequestModel
}

const InvoiceRequestBadge = ({ invoiceRequest }: InvoiceRequestBadgeProps) => {
    const [icon, color] = useInvoiceRequestIcon(invoiceRequest)

    return <IconBadge icon={icon} color={color} />
}

export default InvoiceRequestBadge
