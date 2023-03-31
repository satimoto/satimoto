import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import PeerModel, { PeerModelLike } from "models/Peer"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { lnrpc } from "proto/proto"
import { StoreInterface, Store } from "stores/Store"
import * as lnd from "services/lnd"
import { DEBUG } from "utils/build"
import { errorToString } from "utils/conversion"
import { Log } from "utils/logging"
import { LightningBackend } from "types/lightningBackend"

const log = new Log("PeerStore")

export interface PeerStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    peers: PeerModel[]
    subscribedPeerEvents: boolean

    connectPeer(pubkey: string, host: string): Promise<PeerModel>
    disconnectPeer(pubkey: string): void
    getPeer(pubkey: string): PeerModelLike
}

export class PeerStore implements PeerStoreInterface {
    hydrated = false
    ready = false
    stores

    peers = observable<PeerModel>([])
    subscribedPeerEvents = false

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            peers: observable,
            subscribedPeerEvents: observable,

            actionSetReady: action,
            actionConnectPeer: action,
            actionDisconnectPeer: action,
            actionListPeers: action,
            actionResetPeers: action,
            actionSubscribePeerEvents: action,
            actionPeerEventReceived: action
        })

        makePersistable(
            this,
            { name: "PeerStore", properties: [], storage: AsyncStorage, debugMode: DEBUG },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    async initialize(): Promise<void> {
        try {
            // When the synced to chain, subscribe to Peers
            when(
                () => this.stores.lightningStore.syncedToChain,
                () => this.actionListPeers()
            )
        } catch (error) {
            log.error(`SAT061: Error Initializing: ${error}`, true)
        }
    }

    async connectPeer(pubkey: string, host: string) {
        const peer = await this.actionConnectPeer(pubkey, host)
        
        return peer
    }

    async disconnectPeer(pubkey: string) {
        await this.actionDisconnectPeer(pubkey)
    }

    getPeer(pubkey: string) {
        return this.peers.find((peer) => peer.pubkey === pubkey)
    }

    reset() {
        this.actionResetPeers()
    }

    /*
     * Mobx actions and reactions
     */

    async actionConnectPeer(pubkey: string, host: string) {
        let peer: PeerModelLike = this.getPeer(pubkey)

        if (peer && peer.online) {
            log.debug(`SAT063: Peer ${peer.pubkey} is online`, true)
        } else {
            peer = {
                pubkey,
                online: false
            }

            try {
                await lnd.connectPeer(pubkey, host, true)
                this.peers.push(peer)
            } catch (error) {
                const errorString = errorToString(error)

                if (!errorString.includes("already connected to peer")) {
                    throw error
                }

                peer.online = true
                this.peers.push(peer)
            }
        }

        return peer
    }

    async actionDisconnectPeer(pubkey: string) {
        try {
            const peer: PeerModelLike = this.getPeer(pubkey)

            if (peer) {
                await lnd.disconnectPeer(pubkey)
                this.peers.remove(peer)
            }
        } catch (error) {
            throw error
        }
    }

    async actionListPeers() {
        if (this.stores.lightningStore.backend === LightningBackend.LND) {
            const listPeersResponse = await lnd.listPeers()
            this.peers.clear()

            listPeersResponse.peers.forEach((peer) => {
                if (peer.pubKey) {
                    this.peers.push({
                        pubkey: peer.pubKey,
                        online: false
                    })
                }
            }, this)

            this.actionSubscribePeerEvents()
        }
    }

    actionPeerEventReceived({ pubKey, type }: lnrpc.PeerEvent) {
        log.debug(`SAT065: Peer ${pubKey} is ${type}`, true)

        this.peers.forEach((peer) => {
            if (peer.pubkey === pubKey) {
                peer.online = type === lnrpc.PeerEvent.EventType.PEER_ONLINE
            }
        })
    }

    actionResetPeers() {
        this.subscribedPeerEvents = false
        this.peers.clear()
    }

    actionSetReady() {
        this.ready = true
    }

    actionSubscribePeerEvents() {
        if (!this.subscribedPeerEvents) {
            lnd.subscribePeerEvents((data: lnrpc.PeerEvent) => this.actionPeerEventReceived(data))
            this.subscribedPeerEvents = true
        }
    }
}
