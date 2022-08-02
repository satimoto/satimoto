import EvseModel from "models/Evse"
import { useTheme } from "native-base"
import React, { useEffect, useState } from "react"
import { StyleSheet, View } from "react-native"
import { EvseStatus } from "types/evse"

const styleSheet = StyleSheet.create({
    evseBadge: {
        width: 10,
        height: 10,
        borderRadius: 10
    }
})

interface EvseBadgeProps {
    evse: EvseModel
}

const EvseBadge = ({ evse }: EvseBadgeProps) => {
    const { colors } = useTheme()
    const [backgroundColor, setBackgroundColor] = useState(colors.green["200"])

    useEffect(() => {
        switch (evse.status) {
            case EvseStatus.AVAILABLE:
                setBackgroundColor(colors.green["300"])
                break
            case EvseStatus.CHARGING:
            case EvseStatus.RESERVE:
                setBackgroundColor(colors.yellow["300"])
                break
            default:
                setBackgroundColor(colors.red["300"])
        }
    }, [evse.status])

    return (<View style={[styleSheet.evseBadge, { backgroundColor: backgroundColor }]}></View>)
}

export default EvseBadge
