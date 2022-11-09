interface TokenModel {
    id: number
    uid: string
    visualNumber: string
}

type TokenModelLike = TokenModel | undefined

export default TokenModel
export type { TokenModelLike }
