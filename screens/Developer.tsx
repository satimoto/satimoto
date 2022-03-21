import React from "react"
import { observer } from "mobx-react"
import { Button, View } from "react-native"
import { useColorModeValue, Text } from "native-base"
import { useStore } from "hooks/useStore"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"

type DeveloperProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "Developer">
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
