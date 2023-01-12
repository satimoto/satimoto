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
    peersOnline: boolean
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
    peersOnline = false
    subscribedCustomMessages = false
    subscribedPeerEvents = false

    constructor(stores: Store) {
        this.stores = stores

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            customMessageResponders: observable,
            peers: observable,
            peersOnline: observable,
            subscribedCustomMessages: observable,
            subscribedPeerEvents: observable,

            actionSetReady: action,
            actionAddCustomMessageResponder: action,
            actionRemoveCustomMessageResponder: action,
            actionConnectPeer: action,
            actionDisconnectPeer: action,
            actionListPeers: action,
            actionSubscribeCustomMessages: action,
            actionSubscribePeerEvents: action,
            actionCustomMessageReceived: action,
            actionPeerEventReceived: action
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
                () => this.actionListPeers()
            )
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    addCustomMessageResponder(responder: CustomMessageResponder) {
        this.actionAddCustomMessageResponder(responder)
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

    /*
     * Mobx actions and reactions
     */

    actionAddCustomMessageResponder(responder: CustomMessageResponder) {
        log.debug("Add CustomMessageResponder")
        log.debug(JSON.stringify(responder, undefined, 2))
        this.customMessageResponders.push(responder)
    }

    async actionConnectPeer(pubkey: string, host: string) {
        let peer: PeerModelLike = this.getPeer(pubkey)

        if (peer && peer.online) {
            log.debug(`Peer ${peer.pubkey} is online`)
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
                await disconnectPeer(pubkey)
                this.peers.remove(peer)
            }
        } catch (error) {
            throw error
        }
    }

    async actionListPeers() {
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

            this.actionSubscribeCustomMessages()
            this.actionSubscribePeerEvents()
        } catch (e) {}
    }

    async actionCustomMessageReceived({ peer, type, data }: lnrpc.CustomMessage) {
        const peerStr = bytesToHex(peer)
        const dataStr = toString(data)
        log.debug(`Custom Message ${type} from ${peerStr}: ${dataStr}`)

        const responders = this.customMessageResponders.filter(({ request }) => request.peer === peerStr && request.type === type)

        for (let i = 0; i < responders.length; i++) {
            const responder = responders[i]

            if (type === CUSTOMMESSAGE_CHANNELREQUEST_RECEIVE_CHAN_ID) {
                if (responder.request.data === dataStr) {
                    await sendCustomMessage(responder.response.peer, responder.response.type, responder.response.data)
                    this.actionRemoveCustomMessageResponder(responder)
                    break
                }
            }
        }
    }

    actionPeerEventReceived({ pubKey, type }: lnrpc.PeerEvent) {
        log.debug(`Peer ${pubKey} is ${type}`)
        let areOnline = false

        this.peers.forEach((peer) => {
            if (peer.pubkey === pubKey) {
                peer.online = type === lnrpc.PeerEvent.EventType.PEER_ONLINE
            }

            if (peer.online) {
                areOnline = true
            }
        })

        this.peersOnline = areOnline
    }

    actionRemoveCustomMessageResponder(responder: CustomMessageResponder) {
        log.debug("Remove CustomMessageResponder")
        this.customMessageResponders.remove(responder)
    }

    actionSetReady() {
        this.ready = true
    }

    actionSubscribeCustomMessages() {
        if (!this.subscribedCustomMessages) {
            subscribeCustomMessages((data: lnrpc.CustomMessage) => this.actionCustomMessageReceived(data))
            this.subscribedPeerEvents = true
        }
    }

    actionSubscribePeerEvents() {
        if (!this.subscribedPeerEvents) {
            subscribePeerEvents((data: lnrpc.PeerEvent) => this.actionPeerEventReceived(data))
            this.subscribedPeerEvents = true
        }
    }
}
