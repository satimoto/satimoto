interface UserModel {
    pubkey?: string
    referralCode?: string,
}

type UserModelLike = UserModel | undefined

export default UserModel
export type { UserModelLike }
