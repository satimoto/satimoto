
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
    isSettled: boolean
    isExpired: boolean
    lastUpdated: string
}

type SessionInvoiceModelLike = SessionInvoiceModel | undefined

export default SessionInvoiceModel
export type { SessionInvoiceModelLike }
