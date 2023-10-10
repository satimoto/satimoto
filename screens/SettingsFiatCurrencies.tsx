import ListSwitch from "components/ListSwitch"
import React, { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { useTheme, VStack } from "native-base"
import { ScrollView, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import styles from "utils/styles"
import useColor from "hooks/useColor"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import I18n from "utils/i18n"

interface FiatCurrencyChecked {
    id: string
    name: string
    checked: boolean
}

type SettingsFiatCurrenciesProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "SettingsFiatCurrencies">
}

const SettingsFiatCurrencies = ({ navigation }: SettingsFiatCurrenciesProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const safeAreaInsets = useSafeAreaInsets()
    const [fiatCurrenciesChecked, setFiatCurrenciesChecked] = useState<FiatCurrencyChecked[]>([])
    const { settingStore } = useStore()

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: I18n.t("SettingsFiatCurrencies_HeaderTitle")
        })
    }, [navigation])

    useEffect(() => {
        setFiatCurrenciesChecked(
            settingStore.fiatCurrencies.map(({ id, name }) => {
                return { id, name, checked: settingStore.selectedFiatCurrencies.includes(id) }
            })
        )
    }, [])

    useEffect(() => {
        settingStore.setSelectedFiatCurrencies(fiatCurrenciesChecked.filter(({ checked }) => checked).map(({ id }) => id))
    }, [fiatCurrenciesChecked])

    const onFiatCurrencyCheckedChange = useCallback((fiatCurrencyChecked: FiatCurrencyChecked, index: number) => {
        setFiatCurrenciesChecked((fiatCurrenciesChecked) => [
            ...fiatCurrenciesChecked.slice(0, index),
            { ...fiatCurrencyChecked, checked: !fiatCurrencyChecked.checked },
            ...fiatCurrenciesChecked.slice(index + 1)
        ])
    }, [])

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            <ScrollView style={[styles.matchParent, { backgroundColor, borderRadius: 12, marginTop: 10 }]}>
                <VStack space={3} style={{ paddingBottom: safeAreaInsets.bottom }}>
                    {fiatCurrenciesChecked.map((fiatCurrencyChecked, index) => (
                        <ListSwitch
                            key={fiatCurrencyChecked.id}
                            title={fiatCurrencyChecked.name}
                            titleWeight="bold"
                            style={styles.listSwitch}
                            isChecked={fiatCurrencyChecked.checked}
                            onToggle={() => onFiatCurrencyCheckedChange(fiatCurrencyChecked, index)}
                        />
                    ))}
                </VStack>
            </ScrollView>
        </View>
    )
}

export default observer(SettingsFiatCurrencies)
