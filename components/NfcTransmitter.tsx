import NfcButton from "components/NfcButton"
import React, { useEffect, useState } from "react"
import { StyleProp, ViewStyle } from "react-native"
import { HCESession, NFCTagType4NDEFContentType, NFCTagType4 } from "react-native-hce"
import { Log } from "utils/logging"

const log = new Log("NfcTransmitter")

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
            const tag = new NFCTagType4({type: NFCTagType4NDEFContentType.Text, content: value, writable: false})
            const session = await HCESession.getInstance()
            session.setApplication(tag)
            await session.setEnabled(true)
            setHceSession(session)
        } catch (error) {
            log.debug(`SAT066: NFC error: ${JSON.stringify(error)}`, true)
        }
    }

    const stopTransmitter = async () => {
        if (hceSession) {
            await hceSession.setEnabled(false)
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
