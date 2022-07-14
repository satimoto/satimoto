import React from "react"
import { observer } from "mobx-react"
import { Button } from "react-native"
import { useColorModeValue, Text, View } from "native-base"
import { SafeAreaView } from "react-native-safe-area-context"
import styles from "utils/styles"
import { useStore } from "hooks/useStore"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"

type ReceiveBitcoinProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "ReceiveBitcoin">
}

const ReceiveBitcoin = ({ navigation }: ReceiveBitcoinProps) => {
    const { lightningStore } = useStore()

    return (
        <View flex={1} bg={useColorModeValue("dark.200", "warmGray.50")}>
            <SafeAreaView style={styles.matchParent}>
                <Button title="Toggle" onPress={() => navigation.goBack()} />
                <Text color={useColorModeValue("warmGray.50", "dark.200")}>Block: {lightningStore.blockHeight}</Text>
                <Text color={useColorModeValue("warmGray.50", "dark.200")}>Percent: {lightningStore.percentSynced}</Text>
                <Text color={useColorModeValue("warmGray.50", "dark.200")}>Synced: {lightningStore.syncedToChain ? `true` : `false`}</Text>
            </SafeAreaView>
        </View>
    )
}

export default observer(ReceiveBitcoin)
