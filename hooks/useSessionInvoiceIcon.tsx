import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { faCheck, faTimes, faHourglassHalf } from "@fortawesome/free-solid-svg-icons"
import SessionInvoiceModel from "models/SessionInvoice"
import { useTheme } from "native-base"

type SessionInvoiceIcon = [IconProp, string]

const useSessionInvoiceIcon = (sessionInvoice: SessionInvoiceModel): SessionInvoiceIcon => {
    const { colors } = useTheme()

    if (sessionInvoice.isExpired) {
        return [faTimes, colors.red["300"]]
    } else if (sessionInvoice.isSettled) {
        return [faCheck, colors.green["300"]]
    }

    return [faHourglassHalf, colors.yellow["300"]]
}

export default useSessionInvoiceIcon
