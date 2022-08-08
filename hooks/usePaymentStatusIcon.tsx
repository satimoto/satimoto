import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { faArrowsSpin, faCircleCheck, faCircleExclamation, faCircleQuestion } from "@fortawesome/free-solid-svg-icons"
import { useTheme } from "native-base"
import { PaymentStatus } from "types/payment"

type PaymentStatusIcon = [IconProp, string]

const usePaymentStatusIcon = (status: PaymentStatus): PaymentStatusIcon => {
    const { colors } = useTheme()

    switch (status) {
        case PaymentStatus.EXPIRED:
        case PaymentStatus.FAILED:
            return [faCircleExclamation, colors.red["300"]]
        case PaymentStatus.IN_PROGRESS:
            return [faArrowsSpin, colors.yellow["300"]]
        case PaymentStatus.SUCCEEDED:
            return [faCircleCheck, colors.green["300"]]
    }

    return [faCircleQuestion, colors.yellow["300"]]
}

export default usePaymentStatusIcon
