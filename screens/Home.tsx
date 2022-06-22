import BalanceCard from "components/BalanceCard"
import HomeButtonContainer, { HomeButtonContainerEvent } from "components/HomeButtonContainer"
import LnUrlAuthModal from "components/LnUrlAuthModal"
import SlidingLocationPanel, { createRef } from "components/SlidingLocationPanel"
import SendToAddressModal from "components/SendToAddressModal"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import React, { useEffect, useState } from "react"
import { Dimensions, View } from "react-native"
import MapboxGL, { OnPressEvent, SymbolLayerStyle } from "@react-native-mapbox-gl/maps"
import { AppStackParamList } from "screens/AppStack"
import { IS_ANDROID } from "utils/constants"
import { Log } from "utils/logging"
import styles from "utils/styles"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { autorun } from "mobx"

const empty = require("assets/empty.png")
const busy = require("assets/busy.png")
const full = require("assets/full.png")

const log = new Log("Home")

MapboxGL.setAccessToken("pk.eyJ1Ijoic2F0aW1vdG8iLCJhIjoiY2t6bzlpajQxMzV5MzJwbnI0bW0zOW1waSJ9.RXvZaqPLk3xNagAQ-BAfQg")

let features: any[] = []

const connectorTypes: any = {
    "0": {
        title: "Unknown",
        voltage: 20,
        currentType: "DC"
    },
    "2": {
        title: "CHAdeMO",
        voltage: 20,
        currentType: "DC"
    },
    "17": {
        title: "CEE 5 Pin",
        voltage: 22,
        currentType: "AC (3-Phase)"
    },
    "25": {
        title: "Socket (Type 2)",
        voltage: 22,
        currentType: "AC (3-Phase)"
    },
    "28": {
        title: "CEE 7/4 - Schuko - Type F",
        voltage: 3.7,
        currentType: "AC (1-Phase)"
    },
    "33": {
        title: "CCS (Type 2)",
        voltage: 20,
        currentType: "DC"
    }
}

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
    const slidingLocationPanelRef = createRef()
    const mapViewRef = React.useRef<MapboxGL.MapView>(null)
    const [requestingLocationPermission, setRequestingLocationPermission] = useState(IS_ANDROID)
    const [hasLocationPermission, setHasLocationPermission] = useState(!IS_ANDROID)
    const [locationsShapeSource, setLocationsShapeSource] = useState<any>({ type: "FeatureCollection", features: features })
    const [locationUid, setLocationUid] = useState<string>()

    const [isSendToAddressModalVisible, setIsSendToAddressModalVisible] = useState(false)
    const { uiStore, locationStore } = useStore()

    const includeCamera = () => {
        if (hasLocationPermission) {
            return (
                <>
                    <MapboxGL.Camera zoomLevel={9} followUserLocation />
                    <MapboxGL.UserLocation />
                </>
            )
        }

        return <MapboxGL.Camera zoomLevel={9} />
    }

    const onHomeButtonPress = (event: HomeButtonContainerEvent) => {
        if (event === "send") {
            setIsSendToAddressModalVisible(true)
        } else if (event === "qr") {
            navigation.navigate("SendCamera")
        } else if (event === "receive") {
            navigation.navigate("ReceiveLightning")
        }
    }

    const onLocationPress = ({ coordinates, features }: OnPressEvent) => {
        log.debug(JSON.stringify(coordinates))

        if (features.length) {
            setLocationUid(features[0].properties?.uid)
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

        if (locationUid) {
            setLocationUid(undefined)
        }
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
        if (locationUid) {
            slidingLocationPanelRef.current?.show({ toValue: Dimensions.get("window").height / 2, velocity: 0.1 })
        } else {
            slidingLocationPanelRef.current?.hide()
        }
    }, [locationUid])

    useEffect(() => {
        locationStore.monitorLocationUpdates(true)

        return () => locationStore.monitorLocationUpdates(false)
    }, [])

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
            <BalanceCard />
            <HomeButtonContainer onPress={onHomeButtonPress} />
            <SlidingLocationPanel locationUid={locationUid} ref={slidingLocationPanelRef} onHide={onSlidingLocationPanelHide} />
            <LnUrlAuthModal lnUrlAuthParams={uiStore.lnUrlAuthParams} onClose={() => uiStore.clearLnUrl()} />
            <SendToAddressModal isVisible={isSendToAddressModalVisible} onClose={() => setIsSendToAddressModalVisible(false)} />
        </View>
    )
}

export default observer(Home)

export type { HomeProps }
