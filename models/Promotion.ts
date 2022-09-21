interface PromotionModel {
    code: string
    description?: string
}

type PromotionModelLike = PromotionModel | undefined

export default PromotionModel
export type { PromotionModelLike }
