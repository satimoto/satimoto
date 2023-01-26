import HeaderBackButton from "components/HeaderBackButton"
import EvseButton from "components/EvseButton"
import LocationHeader from "components/LocationHeader"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { observer } from "mobx-react"
import ConnectorModel, { ConnectorGroup } from "models/Connector"
import EvseModel from "models/Evse"
import { useTheme, VStack } from "native-base"
import React, { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { BackHandler, RefreshControl, ScrollView, View } from "react-native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { RouteProp, useFocusEffect } from "@react-navigation/native"
import { useStore } from "hooks/useStore"
import I18n from "utils/i18n"
import styles from "utils/styles"
import LocationModel from "models/Location"
import { useSafeAreaInsets } from "react-native-safe-area-context"

type EvseListProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "EvseList">
    route: RouteProp<AppStackParamList, "EvseList">
}

const EvseList = ({ navigation, route }: EvseListProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const safeAreaInsets = useSafeAreaInsets()
    const [refreshing, setRefreshing] = useState(false)
    const [connectorGroup] = useState<ConnectorGroup>(route.params.connectorGroup)
    const [evses] = useState<EvseModel[]>(route.params.evses)
    const [location, setLocation] = useState<LocationModel>()
    const { locationStore } = useStore()

    useFocusEffect(
        useCallback(() => {
            const backEventListener = BackHandler.addEventListener("hardwareBackPress", onBackPress)

            return () => backEventListener.remove()
        }, [navigation])
    )

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => <HeaderBackButton tintColor={navigationOptions.headerTintColor} onPress={onBackPress} />,
            title: I18n.t("EvseList_HeaderTitle")
        })
    }, [navigation])

    useEffect(() => {
        setLocation(locationStore.selectedLocation)
    }, [locationStore.selectedLocation])

    const onBackPress = useCallback((): boolean => {
        navigation.navigate("Home")
        return true
    }, [navigation])

    const onPress = useCallback(
        (connector: ConnectorModel, evse: EvseModel) => {
            navigation.navigate("ConnectorDetail", { location: locationStore.selectedLocation!, evse, connector })
        },
        [navigation, locationStore.selectedLocation]
    )

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        await locationStore.refreshSelectedLocation()
        setRefreshing(false)
    }, [])

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            <LocationHeader location={location} />
            <ScrollView
                style={[styles.matchParent, { backgroundColor, borderRadius: 12, marginTop: 10 }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <VStack space={3} style={{ paddingBottom: safeAreaInsets.bottom }}>
                    {evses.map((evse) => (
                        <EvseButton key={evse.uid} connectorGroup={connectorGroup} evse={evse} onPress={onPress} />
                    ))}
                </VStack>
            </ScrollView>
        </View>
    )
}

export default observer(EvseList)
