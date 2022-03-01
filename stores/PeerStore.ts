import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { lnrpc } from "proto/proto"
import { IStore, Store } from "stores/Store"
import { connectPeer, disconnectPeer, subscribePeerEvents } from "services/LightningService"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"
import Peer, { PeerLike } from "models/Peer"

const log = new Log("PeerStore")

export interface IPeerStore extends IStore {
    hydrated: boolean
    stores: Store

    peers: Peer[]
    subscribedPeerEvents: boolean

    connectPeer(pubkey: string, host: string): Promise<Peer>
    disconnectPeer(pubkey: string): void
    getPeer(pubkey: string): PeerLike
}

export class PeerStore implements IPeerStore {
    hydrated = false
    ready = false
    stores

    subscribedPeerEvents = false
    peers = observable<Peer>([])

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            peers: observable,
            subscribedPeerEvents: observable,

            setReady: action,
            connectPeer: action,
            disconnectPeer: action
        })

        makePersistable(this, { name: "PeerStore", properties: ["peers"], storage: AsyncStorage, debugMode: DEBUG }, { delay: 1000 }).then(
            action((persistStore) => (this.hydrated = persistStore.isHydrated))
        )
    }

    async initialize(): Promise<void> {
        try {
            // When the synced to chain, subscribe to Peers
            when(
                () => this.stores.lightningStore.syncedToChain,
                () => this.subscribePeerEvents()
            )
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    async connectPeer(pubkey: string, host: string) {
        try {
            let peer: PeerLike = this.getPeer(pubkey)

            if (!peer) {
                peer = {
                    pubkey,
                    online: false
                }

                await connectPeer(pubkey, host)
                this.peers.push(peer)    
            }

            return peer
        } catch (error) {
            throw error
        }
    }

    async disconnectPeer(pubkey: string) {
        try {
            const peer: PeerLike = this.getPeer(pubkey)

            if (peer) {
                await disconnectPeer(pubkey)
                this.peers.remove(peer)
            }
        } catch (error) {
            throw error
        }
    }

    getPeer(pubkey: string) {
        return this.peers.find((peer) => peer.pubkey === pubkey)
    }

    subscribePeerEvents() {
        if (!this.subscribedPeerEvents) {
            subscribePeerEvents((data: lnrpc.PeerEvent) => this.updatePeers(data))
            this.subscribedPeerEvents = true
        }
    }

    setReady() {
        this.ready = true
    }

    updatePeers({ pubKey, type }: lnrpc.PeerEvent) {
        log.debug(`Peer ${pubKey} is ${type}`)
        
        for (let i = 0; i < this.peers.length; i++) {
            if (this.peers[i].pubkey === pubKey) {
                this.peers[i].online = type === lnrpc.PeerEvent.EventType.PEER_ONLINE
            }
        }
    }
}
