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
            <Button title="Ready" onPress={() => store.lightningStore.setReady()} />
            <Text style={{ color: colors.text }}>Developer: {store.lightningStore.ready ? `true` : `false`}</Text>
        </View>
    )
}

export default observer(Developer)
