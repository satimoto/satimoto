import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { faArrowsSpin, faCircleCheck, faCircleExclamation } from "@fortawesome/free-solid-svg-icons"
import { useTheme } from "native-base"
import { InvoiceStatus } from "types/invoice"

type InvoiceStatusIcon = [IconProp, string]

const useInvoiceStatusIcon = (status: InvoiceStatus): InvoiceStatusIcon => {
    const { colors } = useTheme()

    switch (status) {
        case InvoiceStatus.CANCELLED:
            return [faCircleExclamation, colors.red["300"]]
        case InvoiceStatus.SETTLED:
            return [faCircleCheck, colors.green["300"]]
    }

    return [faArrowsSpin, colors.yellow["300"]]
}

export default useInvoiceStatusIcon
