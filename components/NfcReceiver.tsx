import NfcButton from "components/NfcButton"
import React, { useEffect, useState } from "react"
import { StyleProp, ViewStyle } from "react-native"
import NfcManager, { NfcEvents, TagEvent } from "react-native-nfc-manager"
import { toString } from "utils/conversion"

interface NfcReceiverProps {
    onNfcTag: (nfcTag: string) => void
    color?: string
    size?: number
    style?: StyleProp<ViewStyle>
}

const NfcReceiver = ({ onNfcTag, color, size = 50, style = {} }: NfcReceiverProps) => {
    const [isActive, setIsActive] = useState(false)

    const onPress = () => {
        setIsActive(!isActive)
    }

    const startReceiver = async () => {
        stopReceiver()

        try {
            await NfcManager.start()

            NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
                const tagBytes = new Uint8Array(tag.ndefMessage[0].payload)
                const tagStr = toString(tagBytes)

                onNfcTag(tagStr)

                NfcManager.unregisterTagEvent().catch(() => {})
            })

            NfcManager.setEventListener(NfcEvents.SessionClosed, () => {
                setIsActive(false)
            })

            NfcManager.registerTagEvent();
        } catch {
            setIsActive(false)
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

    return <NfcButton isActive={isActive} onPress={onPress} color={color} size={size} style={style} />
}

export default NfcReceiver
