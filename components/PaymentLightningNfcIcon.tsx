import React from "react"
import { StyleProp, ViewStyle } from "react-native"
import { SvgXml } from "react-native-svg"

const xml = `
<svg width="500" height="500" viewBox="0 0 24 24" fill="none">
    <path d="M16.3 19.5002C17.4 17.2002 18 14.7002 18 12.0002C18 9.30024 17.4 6.70024 16.3 4.50024M12.7 17.8003C13.5 16.0003 14 14.0003 14 12.0003C14 10.0003 13.5 7.90034 12.7 6.10034M9.1001 16.1001C9.7001 14.8001 10.0001 13.4001 10.0001 12.0001C10.0001 10.6001 9.7001 9.10015 9.1001 7.90015M5.5 14.3003C5.8 13.6003 6 12.8003 6 12.0003C6 11.2003 5.8 10.3003 5.5 9.60034" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`

interface PaymentLightningNfcIconProps {
    size: number
    enabled: boolean
    style?: StyleProp<ViewStyle>
}

const PaymentLightningNfcIcon = ({ size, enabled, style = {} }: PaymentLightningNfcIconProps) => {
    return <SvgXml xml={xml} width={size} height={size} stroke={enabled ? "#ffffff" : "#000000"} style={style} />
}

export default PaymentLightningNfcIcon
