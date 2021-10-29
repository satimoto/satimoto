import React from "react"
import { observer } from "mobx-react"
import { Button, Text, View } from "react-native"
import { useTheme } from "@react-navigation/native"
import { DeveloperStackNavigationProp } from "screens/DeveloperStack"
import { store } from "stores/Store"

type DeveloperProps = {
    navigation: DeveloperStackNavigationProp
}

const Developer = ({ navigation }: DeveloperProps) => {
    const { colors } = useTheme()

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Button title="Toggle" onPress={() => navigation.toggleDrawer()} />
            <Text style={{ color: colors.text }}>Block: {store.lightningStore.blockHeight}</Text>
            <Text style={{ color: colors.text }}>Percent: {store.lightningStore.percentSynced}</Text>
            <Text style={{ color: colors.text }}>Synced: {store.lightningStore.syncedToChain ? `true` : `false`}</Text>
        </View>
    )
}

export default observer(Developer)
