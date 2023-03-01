import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { faCheck, faTimes, faHourglassHalf } from "@fortawesome/free-solid-svg-icons"
import { useTheme } from "native-base"
import { InvoiceStatus } from "types/invoice"

type InvoiceStatusIcon = [IconProp, string]

const useInvoiceStatusIcon = (status: InvoiceStatus): InvoiceStatusIcon => {
    const { colors } = useTheme()

    switch (status) {
        case InvoiceStatus.CANCELLED:
        case InvoiceStatus.EXPIRED:
            return [faTimes, colors.red["300"]]
        case InvoiceStatus.SETTLED:
            return [faCheck, colors.green["300"]]
    }

    return [faHourglassHalf, colors.yellow["300"]]
}

export default useInvoiceStatusIcon
