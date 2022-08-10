
interface PeerModel {
    pubkey: string
    online: boolean
}

type PeerModelLike = PeerModel | undefined

export default PeerModel
export type { PeerModelLike }
