import HeaderBackButton from "components/HeaderBackButton"
import EvseButton from "components/EvseButton"
import LocationHeader from "components/LocationHeader"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { observer } from "mobx-react"
import ConnectorModel from "models/Connector"
import EvseModel from "models/Evse"
import LocationModel from "models/Location"
import { useTheme, VStack } from "native-base"
import React, { useCallback, useLayoutEffect, useState } from "react"
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { RouteProp } from "@react-navigation/native"
import { useStore } from "hooks/useStore"
import I18n from "utils/i18n"
import styles from "utils/styles"

const styleSheet = StyleSheet.create({
    scrollViewContainer: {
        flex: 1
    }
})

type EvseListProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "EvseList">
    route: RouteProp<AppStackParamList, "EvseList">
}

const EvseList = ({ navigation, route }: EvseListProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const [refreshing, setRefreshing] = useState(false)
    const [connector, setConnector] = useState<ConnectorModel>(route.params.connector)
    const [evses, setEvses] = useState<EvseModel[]>(route.params.evses)
    const { locationStore } = useStore()

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <HeaderBackButton
                    tintColor={navigationOptions.headerTintColor}
                    onPress={() => {
                        navigation.navigate("Home")
                    }}
                />
            ),
            title: I18n.t("EvseList_HeaderTitle")
        })
    }, [navigation])

    const onPress = useCallback((connector, evse) => {
        navigation.navigate("ConnectorDetail", { location: locationStore.activeLocation!, evse, connector })
    }, [])

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        const location = await locationStore.refreshActiveLocation()
        setRefreshing(false)
    }, [])

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            <ScrollView
                contentContainerStyle={styleSheet.scrollViewContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <VStack space={3}>
                    <LocationHeader location={locationStore.activeLocation!} />
                    {evses.map((evse) => (
                        <EvseButton key={evse.uid} connector={connector} evse={evse} onPress={onPress} />
                    ))}
                </VStack>
            </ScrollView>
        </View>
    )
}

export default observer(EvseList)
