import React from "react"
import { observer } from "mobx-react"
import { Button, View } from "react-native"
import { useColorModeValue, Text } from "native-base"
import { HomeNavigationProp } from "screens/AppStack"
import { useStore } from "hooks/useStore"

type DeveloperProps = {
    navigation: HomeNavigationProp
}

const Developer = ({ navigation }: DeveloperProps) => {
    const { lightningStore } = useStore()
    
    return (
        <View style={{ flex: 1, backgroundColor: useColorModeValue("warmGray.50", "coolGray.800") }}>
            <Button title="Toggle" onPress={() => navigation.navigate("Home")} />
            <Text>Block: {lightningStore.blockHeight}</Text>
            <Text>Percent: {lightningStore.percentSynced}</Text>
            <Text>Synced: {lightningStore.syncedToChain ? `true` : `false`}</Text>
        </View>
    )
}

export default observer(Developer)
