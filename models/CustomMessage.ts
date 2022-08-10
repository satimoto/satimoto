interface CustomMessageModel {
    peer: string
    type: number
    data: any
}

type CustomMessageModelLike = CustomMessageModel | undefined

export default CustomMessageModel
export type { CustomMessageModelLike }
