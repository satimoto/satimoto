import BalanceCard from "components/BalanceCard"
import ChargeButton from "components/ChargeButton"
import HomeFooterContainer, { HomeFooterContainerEvent } from "components/HomeFooterContainer"
import LnUrlAuthModal from "components/LnUrlAuthModal"
import ReceiveLightningModal from "components/ReceiveLightningModal"
import SlidingLocationPanel, { createSlidingUpPanelRef } from "components/SlidingLocationPanel"
import SendToAddressModal from "components/SendToAddressModal"
import { useStore } from "hooks/useStore"
import { autorun } from "mobx"
import { observer } from "mobx-react"
import React, { useEffect, useRef, useState } from "react"
import { Dimensions, View } from "react-native"
import MapboxGL, { OnPressEvent, SymbolLayerStyle } from "@react-native-mapbox-gl/maps"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import store from "stores/Store"
import { IS_ANDROID } from "utils/constants"
import { Log } from "utils/logging"
import styles from "utils/styles"
import useLayout from "hooks/useLayout"

const empty = require("assets/empty.png")
const busy = require("assets/busy.png")
const full = require("assets/full.png")

const log = new Log("Home")

MapboxGL.setAccessToken("pk.eyJ1Ijoic2F0aW1vdG8iLCJhIjoiY2t6bzlpajQxMzV5MzJwbnI0bW0zOW1waSJ9.RXvZaqPLk3xNagAQ-BAfQg")

const symbolLayer: SymbolLayerStyle = {
    iconAnchor: "bottom",
    iconAllowOverlap: true,
    iconImage: ["case", ["==", ["get", "availableEvses"], ["get", "totalEvses"]], "empty", ["==", ["get", "availableEvses"], 0], "full", "busy"],
    iconSize: 0.5,
    textAnchor: "bottom",
    textOffset: [0, -1.5],
    textColor: "#ffffff",
    textField: ["to-string", ["get", "availableEvses"]]
}

export type HomeNavigationProp = NativeStackNavigationProp<AppStackParamList, "Home">

interface HomeProps {
    navigation: HomeNavigationProp
}

const Home = ({ navigation }: HomeProps) => {
    const slidingLocationPanelRef = createSlidingUpPanelRef()
    const mapViewRef = useRef<MapboxGL.MapView>(null)
    const mapCameraRef = useRef<MapboxGL.Camera>(null)
    const [balanceCardRectangle, onBalanceCardLayout] = useLayout()
    const [requestingLocationPermission, setRequestingLocationPermission] = useState(IS_ANDROID)
    const [hasLocationPermission, setHasLocationPermission] = useState(!IS_ANDROID)
    const [locationsShapeSource, setLocationsShapeSource] = useState<any>({ type: "FeatureCollection", features: [] })
    const [isReceiveLightningModalVisible, setIsReceiveLightningModalVisible] = useState(false)
    const [isSendToAddressModalVisible, setIsSendToAddressModalVisible] = useState(false)
    const { uiStore, lightningStore, locationStore, sessionStore } = useStore()

    const includeCamera = () => {
        if (hasLocationPermission) {
            return (
                <>
                    <MapboxGL.Camera ref={mapCameraRef} zoomLevel={9} followUserLocation={true} />
                    <MapboxGL.UserLocation />
                </>
            )
        }

        return <MapboxGL.Camera ref={mapCameraRef} zoomLevel={9} />
    }

    const onChargeButtonPress = () => {
        navigation.navigate("ChargeDetail")
    }

    const onHomeButtonPress = (event: HomeFooterContainerEvent) => {
        if (event === "send") {
            setIsSendToAddressModalVisible(true)
        } else if (event === "qr") {
            navigation.navigate("Scanner")
        } else if (event === "receive") {
            setIsReceiveLightningModalVisible(true)
        }
    }

    const onLocationPress = ({ coordinates, features }: OnPressEvent) => {
        log.debug(JSON.stringify(coordinates))

        if (features.length) {
            store.locationStore.setSelectedLocation(features[0].properties?.uid)
        }

        log.debug(JSON.stringify(features))
    }

    const onRegionDidChange = async () => {
        if (mapViewRef.current) {
            const bounds = await mapViewRef.current.getVisibleBounds()

            locationStore.setBounds(bounds)
        }
    }

    const onSlidingLocationPanelHide = () => {
        log.debug("onSlidingLocationPanelHide")
        locationStore.removeSelectedLocation()
    }

    useEffect(() => {
        const requestPermissions = async () => {
            const isGranted = await MapboxGL.requestAndroidLocationPermissions()
            setHasLocationPermission(isGranted)
            setRequestingLocationPermission(false)
        }

        if (requestingLocationPermission) {
            requestPermissions()
        }
    }, [])

    useEffect(() => {
        if (locationStore.selectedLocation) {
            slidingLocationPanelRef.current?.show({ toValue: Dimensions.get("window").height / 2, velocity: 0.1 })
        } else {
            slidingLocationPanelRef.current?.hide()
        }
    }, [locationStore.selectedLocation])

    useEffect(() => {
        locationStore.startLocationUpdates()

        return () => locationStore.stopLocationUpdates()
    }, [])

    useEffect(() => {
        if (hasLocationPermission) {
            log.debug("zoom")
            mapCameraRef.current?.zoomTo(9)
        }
    }, [lightningStore.syncedToChain])

    useEffect(
        () =>
            autorun(() => {
                log.debug("locations changed")

                setLocationsShapeSource({
                    type: "FeatureCollection",
                    features: locationStore.locations.map((location) => {
                        return {
                            id: location.uid,
                            type: "Feature",
                            geometry: location.geom,
                            properties: location
                        }
                    })
                })
            }),
        []
    )

    return (
        <View style={styles.matchParent}>
            <MapboxGL.MapView
                attributionEnabled={false}
                compassEnabled={false}
                logoEnabled={false}
                onRegionDidChange={onRegionDidChange}
                ref={mapViewRef}
                style={styles.matchParent}
                styleURL={MapboxGL.StyleURL.Street}
            >
                {includeCamera()}
                <MapboxGL.Images
                    images={{
                        busy,
                        empty,
                        full
                    }}
                />
                <MapboxGL.ShapeSource id="locationsShapeSource" onPress={onLocationPress} shape={locationsShapeSource}>
                    <MapboxGL.SymbolLayer id="locationsSymbolLayer" style={symbolLayer} />
                </MapboxGL.ShapeSource>
            </MapboxGL.MapView>
            <BalanceCard onLayout={onBalanceCardLayout} />
            <ChargeButton
                satoshis={parseInt(sessionStore.valueSat)}
                top={balanceCardRectangle.y + balanceCardRectangle.height}
                onPress={onChargeButtonPress}
            />
            <HomeFooterContainer onPress={onHomeButtonPress} />
            <SlidingLocationPanel ref={slidingLocationPanelRef} onHide={onSlidingLocationPanelHide} />
            <LnUrlAuthModal lnUrlAuthParams={uiStore.lnUrlAuthParams} onClose={() => uiStore.clearLnUrl()} />
            <SendToAddressModal isVisible={isSendToAddressModalVisible} onClose={() => setIsSendToAddressModalVisible(false)} />
            <ReceiveLightningModal isVisible={isReceiveLightningModalVisible} onClose={() => setIsReceiveLightningModalVisible(false)} />
        </View>
    )
}

export default observer(Home)

export type { HomeProps }
