import React from "react"
import { observer } from "mobx-react"
import { Button, View } from "react-native"
import { useColorModeValue, Text } from "native-base"
import { store } from "stores/Store"
import { HomeNavigationProp } from "screens/AppStack"

type DeveloperProps = {
    navigation: HomeNavigationProp
}

const Developer = ({ navigation }: DeveloperProps) => {
    return (
        <View style={{ flex: 1, backgroundColor: useColorModeValue("warmGray.50", "coolGray.800") }}>
            <Button title="Toggle" onPress={() => navigation.navigate("Home")} />
            <Text>Block: {store.lightningStore.blockHeight}</Text>
            <Text>Percent: {store.lightningStore.percentSynced}</Text>
            <Text>Synced: {store.lightningStore.syncedToChain ? `true` : `false`}</Text>
        </View>
    )
}

export default observer(Developer)
