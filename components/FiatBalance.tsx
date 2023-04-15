import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { FiatCurrencyModelLike } from "models/FiatCurrency"
import React, { useCallback, useEffect, useState } from "react"
import { StyleProp, Text, ViewStyle } from "react-native"

interface FiatBalanceProps {
    satoshis: number
    style?: StyleProp<ViewStyle>
    color?: string
    size?: number
    weight?: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900" | undefined
}

const FiatBalance = ({ style = {}, color = "#FFFFFF", size = 38, weight = "normal", satoshis }: FiatBalanceProps) => {
    const { settingStore } = useStore()
    const [amount, setAmount] = useState(0)
    const [formattedAmount, setFormattedAmount] = useState("")
    const [fiatCurrency, setFiatCurrency] = useState<FiatCurrencyModelLike>()

    useEffect(() => {
        setFormattedAmount(fiatCurrency ? `${fiatCurrency.symbol} ${amount.toFixed(fiatCurrency.decimals)}` : "")
    }, [fiatCurrency, amount])

    useEffect(() => {
        setAmount(settingStore.selectedFiatRate ? (settingStore.selectedFiatRate / 100000000) * satoshis : 0)
    }, [settingStore.selectedFiatRate, satoshis])

    useEffect(() => {
        setFiatCurrency(settingStore.fiatCurrencies.find(({ id }) => id === settingStore.selectedFiatCurrency))
    }, [settingStore.selectedFiatCurrency])

    useEffect(() => {
        setFiatCurrency(settingStore.fiatCurrencies.find(({ id }) => id === settingStore.selectedFiatCurrency))
    }, [])

    const onPress = useCallback(() => {
        settingStore.selectNextFiatCurrency()
    }, [settingStore])

    return (
        <TouchableOpacityOptional onPress={onPress} style={style}>
            <Text style={{ fontSize: size, fontWeight: weight, color: color }}>{formattedAmount}</Text>
        </TouchableOpacityOptional>
    )
}

export default observer(FiatBalance)
