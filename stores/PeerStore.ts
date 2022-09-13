import { action, makeObservable, observable, when } from "mobx"
import { makePersistable } from "mobx-persist-store"
import CustomMessageModel from "models/CustomMessage"
import PeerModel, { PeerModelLike } from "models/Peer"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { lnrpc } from "proto/proto"
import { StoreInterface, Store } from "stores/Store"
import { connectPeer, disconnectPeer, listPeers, sendCustomMessage, subscribeCustomMessages, subscribePeerEvents } from "services/LightningService"
import { DEBUG } from "utils/build"
import { CUSTOMMESSAGE_CHANNELREQUEST_RECEIVE_CHAN_ID } from "utils/constants"
import { bytesToHex, errorToString, toString } from "utils/conversion"
import { Log } from "utils/logging"

const log = new Log("PeerStore")

export interface CustomMessageResponder {
    request: CustomMessageModel
    response: CustomMessageModel
}

export interface PeerStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    customMessageResponders: CustomMessageResponder[]
    peers: PeerModel[]
    subscribedCustomMessages: boolean
    subscribedPeerEvents: boolean

    addCustomMessageResponder(responder: CustomMessageResponder): void
    connectPeer(pubkey: string, host: string): Promise<PeerModel>
    disconnectPeer(pubkey: string): void
    getPeer(pubkey: string): PeerModelLike
}

export class PeerStore implements PeerStoreInterface {
    hydrated = false
    ready = false
    stores

    customMessageResponders = observable<CustomMessageResponder>([])
    peers = observable<PeerModel>([])
    subscribedCustomMessages = false
    subscribedPeerEvents = false

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            customMessageResponders: observable,
            peers: observable,
            subscribedCustomMessages: observable,
            subscribedPeerEvents: observable,

            setReady: action,
            addCustomMessageResponder: action,
            removeCustomMessageResponder: action,
            connectPeer: action,
            disconnectPeer: action,
            listPeers: action,
            subscribeCustomMessages: action,
            subscribePeerEvents: action,
            onCustomMessage: action,
            onPeerEvent: action
        })

        makePersistable(
            this,
            { name: "PeerStore", properties: ["customMessageResponders"], storage: AsyncStorage, debugMode: DEBUG },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    async initialize(): Promise<void> {
        try {
            // When the synced to chain, subscribe to Peers
            when(
                () => this.stores.lightningStore.syncedToChain,
                () => this.listPeers()
            )
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    addCustomMessageResponder(responder: CustomMessageResponder) {
        log.debug("Add CustomMessageResponder")
        log.debug(JSON.stringify(responder, undefined, 2))
        this.customMessageResponders.push(responder)
    }

    async connectPeer(pubkey: string, host: string) {
        let peer: PeerModelLike = this.getPeer(pubkey)

        if (peer) {
            log.debug(`Peer  ${peer.pubkey} is ${peer.online ? "online" : "offline"}`)
        } else {
            peer = {
                pubkey,
                online: false
            }

            try {
                await connectPeer(pubkey, host, true)
                this.peers.push(peer)
            } catch (error) {
                const errorString = errorToString(error)

                if (errorString.includes("already connected to peer")) {
                    peer.online = true
                    this.peers.push(peer)

                    return peer
                }

                throw error
            }
        }

        return peer
    }

    async disconnectPeer(pubkey: string) {
        try {
            const peer: PeerModelLike = this.getPeer(pubkey)

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

    async listPeers() {
        try {
            const listPeersResponse = await listPeers()
            this.peers.clear()

            listPeersResponse.peers.forEach((peer) => {
                if (peer.pubKey) {
                    this.peers.push({
                        pubkey: peer.pubKey,
                        online: false
                    })
                }
            }, this)

            this.subscribeCustomMessages()
            this.subscribePeerEvents()
        } catch (e) {}
    }

    async onCustomMessage({ peer, type, data }: lnrpc.CustomMessage) {
        const peerStr = bytesToHex(peer)
        const dataStr = toString(data)
        log.debug(`Custom Message ${type} from ${peerStr}: ${dataStr}`)

        const responders = this.customMessageResponders.filter(({ request }) => request.peer === peerStr && request.type === type)

        for (let i = 0; i < responders.length; i++) {
            const responder = responders[i]

            if (type === CUSTOMMESSAGE_CHANNELREQUEST_RECEIVE_CHAN_ID) {
                if (responder.request.data === dataStr) {
                    await sendCustomMessage(responder.response.peer, responder.response.type, responder.response.data)
                    this.removeCustomMessageResponder(responder)
                    break
                }
            }
        }
    }

    onPeerEvent({ pubKey, type }: lnrpc.PeerEvent) {
        log.debug(`Peer ${pubKey} is ${type}`)

        this.peers.forEach((peer) => {
            if (peer.pubkey === pubKey) {
                peer.online = type === lnrpc.PeerEvent.EventType.PEER_ONLINE
            }
        })
    }

    removeCustomMessageResponder(responder: CustomMessageResponder) {
        log.debug("Remove CustomMessageResponder")
        this.customMessageResponders.remove(responder)
    }

    setReady() {
        this.ready = true
    }

    subscribeCustomMessages() {
        if (!this.subscribedCustomMessages) {
            subscribeCustomMessages((data: lnrpc.CustomMessage) => this.onCustomMessage(data))
            this.subscribedPeerEvents = true
        }
    }

    subscribePeerEvents() {
        if (!this.subscribedPeerEvents) {
            subscribePeerEvents((data: lnrpc.PeerEvent) => this.onPeerEvent(data))
            this.subscribedPeerEvents = true
        }
    }
}
