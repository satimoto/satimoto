import NfcButton from "components/NfcButton"
import NfcReceiver from "components/NfcReceiver"
import React, { useState } from "react"
import { StyleProp, ViewStyle } from "react-native"
import { TagEvent } from "react-native-nfc-manager"
import { toString } from "utils/conversion"

interface NfcReceiverButtonProps {
    onTag: (nfcTag: string) => void
    color?: string
    size?: number
    style?: StyleProp<ViewStyle>
}

const NfcReceiverButton = ({ onTag, color, size = 50, style = {} }: NfcReceiverButtonProps) => {
    const [isActive, setIsActive] = useState(false)

    const onButtonPress = () => {
        setIsActive(!isActive)
    }

    const onNfcTag = (tag: TagEvent) => {
        const tagBytes = new Uint8Array(tag.ndefMessage[0].payload)
        const tagStr = toString(tagBytes)

        onTag(tagStr)
    }

    return (
        <NfcReceiver isActive={isActive} onTag={onNfcTag} onClose={() => setIsActive(false)}>
            <NfcButton isActive={isActive} onPress={onButtonPress} color={color} size={size} style={style} />
        </NfcReceiver>
    )
}

export default NfcReceiverButton
