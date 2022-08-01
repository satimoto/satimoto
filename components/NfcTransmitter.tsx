import NfcButton from "components/NfcButton"
import React, { useEffect, useState } from "react"
import { StyleProp, ViewStyle } from "react-native"
import HCESession, { NFCContentType, NFCTagType4 } from "react-native-hce"

interface NfcTransmitterProps {
    value: string
    color?: string
    size?: number
    style?: StyleProp<ViewStyle>
}

const NfcTransmitter = ({ value, color, size = 50, style = {} }: NfcTransmitterProps) => {
    const [isActive, setIsActive] = useState(false)
    const [hceSession, setHceSession] = useState<HCESession>()

    const onPress = () => {
        setIsActive(!isActive)
    }

    const startTransmitter = async () => {
        stopTransmitter()

        try {
            const tag = new NFCTagType4(NFCContentType.Text, value)
            const session = await new HCESession(tag).start()
            setHceSession(session)
        } catch {}
    }

    const stopTransmitter = async () => {
        if (hceSession) {
            await hceSession.terminate()
        }
    }

    useEffect(() => {
        if (isActive) {
            startTransmitter()
        } else {
            stopTransmitter()
        }
    }, [isActive])

    useEffect(() => {
        return () => {
            stopTransmitter()
        }
    }, [])

    return <NfcButton isActive={isActive} onPress={onPress} color={color} size={size} style={style} />
}

export default NfcTransmitter
