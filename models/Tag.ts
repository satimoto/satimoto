
interface TagModel {
    key: string
    value: string
}

type TagModelLike = TagModel | undefined

export default TagModel
export type { TagModelLike }
