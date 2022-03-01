
interface Peer {
    pubkey: string
    online: boolean
}

type PeerLike = Peer | undefined

export default Peer
export type { PeerLike }
