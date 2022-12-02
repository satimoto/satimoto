import SatoshiBalance from "components/SatoshiBalance"
import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import React, { useEffect, useState } from "react"
import { StyleSheet } from "react-native"
import { observer } from "mobx-react"
import PriceComponentModel, { calculateTotalPrice } from "models/PriceComponent"
import { Badge, IBadgeProps } from "native-base"
import { toNumber, toSatoshi } from "utils/conversion"

const styleSheet = StyleSheet.create({
    icon: {
        marginLeft: 3
    }
})

interface PriceComponentPillProps extends IBadgeProps {
    priceComponent: PriceComponentModel
    appendText?: string
    icon?: IconProp
}

const PriceComponentPill = ({ priceComponent, appendText, icon, ...props }: PriceComponentPillProps) => {
    const [price, setPrice] = useState(0)

    useEffect(() => {
        setPrice(toNumber(toSatoshi(calculateTotalPrice(priceComponent))))
    }, [priceComponent])

    return (
        <Badge
            borderRadius="full"
            padding={2}
            {...props}
        >
            <SatoshiBalance size={14} paddingSize={30} color="#ffffff" satoshis={price} appendText={appendText} >
                {icon && (<FontAwesomeIcon icon={icon} style={styleSheet.icon} color="#ffffff" size={14} />)}
            </SatoshiBalance>
        </Badge>
    )
}

export default observer(PriceComponentPill)
