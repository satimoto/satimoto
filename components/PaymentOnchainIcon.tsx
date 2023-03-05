import React from "react"
import { StyleProp, ViewStyle } from "react-native"
import { SvgXml } from "react-native-svg"

const xml = `
<svg width="500" height="500" viewBox="0 0 24 24" fill="none">
	<path d="M10 6V4M14 6V4M14 6H7M14 6C15.6569 6 17 7.34315 17 9C17 10.6569 15.6569 12 14 12M9 18L9 12M9 6V12M10 20V18M14 20V18M9 12H15C16.6569 12 18 13.3431 18 15C18 16.6569 16.6569 18 15 18H7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`

interface PaymentOnchainIconProps {
    size: number
    enabled: boolean
    style?: StyleProp<ViewStyle>
}

const PaymentOnchainIcon = ({ size, enabled, style = {} }: PaymentOnchainIconProps) => {
    return <SvgXml xml={xml} width={size} height={size} stroke={enabled ? "#ffffff" : "#000000"} style={style} />
}

export default PaymentOnchainIcon
