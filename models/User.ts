import NodeModel from "models/Node"

interface UserModel {
    pubkey?: string
    referralCode?: string
    batteryCapacity?: number
    batteryPowerAc?: number
    batteryPowerDc?: number
    node?: NodeModel
}

type UserModelLike = UserModel | undefined

export default UserModel
export type { UserModelLike }
