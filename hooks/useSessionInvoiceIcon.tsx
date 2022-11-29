import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { faArrowsSpin, faCircleCheck, faCircleExclamation } from "@fortawesome/free-solid-svg-icons"
import SessionInvoiceModel from "models/SessionInvoice"
import { useTheme } from "native-base"

type SessionInvoiceIcon = [IconProp, string]

const useSessionInvoiceIcon = (sessionInvoice: SessionInvoiceModel): SessionInvoiceIcon => {
    const { colors } = useTheme()

    if (sessionInvoice.isExpired) {
        return [faCircleExclamation, colors.red["300"]]
    } else if (sessionInvoice.isSettled) {
        return [faCircleCheck, colors.green["300"]]
    }

    return [faArrowsSpin, colors.yellow["300"]]
}

export default useSessionInvoiceIcon
