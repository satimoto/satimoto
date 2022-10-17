import React, { PropsWithChildren, useEffect } from "react"
import NfcManager, { NfcEvents, TagEvent } from "react-native-nfc-manager"

interface NfcReceiverProps extends PropsWithChildren<any> {
    isActive: boolean
    onTag: (nfcTagEvent: TagEvent) => void
    onClose?: () => void
}

const NfcReceiver = ({ children, isActive, onTag, onClose = () => {} }: NfcReceiverProps) => {
    const startReceiver = async () => {
        stopReceiver()

        try {
            await NfcManager.start()

            NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
                onTag(tag)

                NfcManager.unregisterTagEvent().catch(() => {})
            })

            NfcManager.setEventListener(NfcEvents.SessionClosed, () => {
                onClose()
            })

            NfcManager.registerTagEvent();
        } catch {
            onClose()
        }
    }

    const stopReceiver = () => {
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null)
        NfcManager.setEventListener(NfcEvents.SessionClosed, null)
    }

    useEffect(() => {
        if (isActive) {
            startReceiver()
        } else {
            stopReceiver()
        }
    }, [isActive])

    useEffect(() => {
        return () => {
            stopReceiver()
        }
    }, [])

    return children
}

export default NfcReceiver
