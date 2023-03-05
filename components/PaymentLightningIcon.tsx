import React from "react"
import { StyleProp, ViewStyle } from "react-native"
import { SvgXml } from "react-native-svg"

const xml = `
<svg width="500" height="500" viewBox="0 0 24 24" fill="none">
    <path d="M4 14L14 2L12.9545 10H20L10 22L11.0455 14H4Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`

interface PaymentLightningIconProps {
    size: number
    enabled: boolean
    style?: StyleProp<ViewStyle>
}

const PaymentLightningIcon = ({ size, enabled, style = {} }: PaymentLightningIconProps) => {
    return <SvgXml xml={xml} width={size} height={size} stroke={enabled ? "#ffffff" : "#000000"} style={style} />
}

export default PaymentLightningIcon
