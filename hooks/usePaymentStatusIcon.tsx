import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { faCheck, faTimes, faQuestion, faHourglassHalf } from "@fortawesome/free-solid-svg-icons"
import { useTheme } from "native-base"
import { PaymentStatus } from "types/payment"

type PaymentStatusIcon = [IconProp, string]

const usePaymentStatusIcon = (status: PaymentStatus): PaymentStatusIcon => {
    const { colors } = useTheme()

    switch (status) {
        case PaymentStatus.EXPIRED:
        case PaymentStatus.FAILED:
            return [faTimes, colors.red["300"]]
        case PaymentStatus.IN_PROGRESS:
            return [faHourglassHalf, colors.yellow["300"]]
        case PaymentStatus.SUCCEEDED:
            return [faCheck, colors.green["300"]]
    }

    return [faQuestion, colors.yellow["300"]]
}

export default usePaymentStatusIcon
