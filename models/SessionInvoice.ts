
interface SessionInvoiceModel {
    id: number
    currency: string
    currencyRate: number
    currencyRateMsat: number
    priceFiat: number
    priceMsat: number
    commissionFiat: number
    commissionMsat: number
    taxFiat: number
    taxMsat: number
    totalFiat: number
    totalMsat: number
    paymentRequest: string
    signature: string
    isSettled: boolean
    isExpired: boolean
    estimatedEnergy: number
    estimatedTime: number
    meteredEnergy: number
    meteredTime: number
    lastUpdated: string
}

type SessionInvoiceModelLike = SessionInvoiceModel | undefined

export default SessionInvoiceModel
export type { SessionInvoiceModelLike }
