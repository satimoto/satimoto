import PromotionModel from "models/Promotion"

interface InvoiceRequestModel {
    id: number
    promotion: PromotionModel
    currency: string
    memo: string
    priceFiat?: number
    priceMsat?: number
    commissionFiat?: number
    commissionMsat?: number
    taxFiat?: number
    taxMsat?: number
    totalFiat: number
    totalMsat: number
    isSettled: boolean
    releaseDate?: string
}

type InvoiceRequestModelLike = InvoiceRequestModel | undefined

export default InvoiceRequestModel
export type { InvoiceRequestModelLike }
