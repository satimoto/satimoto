import IconBadge from "components/IconBadge"
import useSessionInvoiceIcon from "hooks/useSessionInvoiceIcon"
import SessionInvoiceModel from "models/SessionInvoice"
import React from "react"

interface SessionInvoiceBadgeProps {
    sessionInvoice: SessionInvoiceModel
}

const SessionInvoiceBadge = ({ sessionInvoice }: SessionInvoiceBadgeProps) => {
    const [icon, color] = useSessionInvoiceIcon(sessionInvoice)

    return <IconBadge icon={icon} color={color} />
}

export default SessionInvoiceBadge
