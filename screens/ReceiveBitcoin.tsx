import React from "react"
import { observer } from "mobx-react"
import { Button } from "react-native"
import { useColorModeValue, Text, View } from "native-base"
import { store } from "stores/Store"
import { ReceiveBitcoinNavigationProp } from "screens/ReceiveStack"
import { SafeAreaView } from "react-native-safe-area-context"
import styles from "utils/styles"

type ReceiveBitcoinProps = {
    navigation: ReceiveBitcoinNavigationProp
}

const ReceiveBitcoin = ({ navigation }: ReceiveBitcoinProps) => {
    return (
        <View flex={1} bg={useColorModeValue("dark.200", "warmGray.50")}>
            <SafeAreaView style={styles.matchParent}>
                <Button title="Toggle" onPress={() => navigation.goBack()} />
                <Text color={useColorModeValue("warmGray.50", "dark.200")}>Block: {store.lightningStore.blockHeight}</Text>
                <Text color={useColorModeValue("warmGray.50", "dark.200")}>Percent: {store.lightningStore.percentSynced}</Text>
                <Text color={useColorModeValue("warmGray.50", "dark.200")}>Synced: {store.lightningStore.syncedToChain ? `true` : `false`}</Text>
            </SafeAreaView>
        </View>
    )
}

export default observer(ReceiveBitcoin)
