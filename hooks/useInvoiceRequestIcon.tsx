import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { faCheck, faHourglassHalf } from "@fortawesome/free-solid-svg-icons"
import InvoiceRequestModel from "models/InvoiceRequest"
import { useTheme } from "native-base"

type InvoiceRequestIcon = [IconProp, string]

const useInvoiceRequestIcon = (invoiceRequest: InvoiceRequestModel): InvoiceRequestIcon => {
    const { colors } = useTheme()

    if (invoiceRequest.isSettled) {
        return [faCheck, colors.green["300"]]
    }

    return [faHourglassHalf, colors.yellow["300"]]
}

export default useInvoiceRequestIcon
