import BalanceCard from "components/BalanceCard"
import ChargeButton from "components/ChargeButton"
import FilterButton from "components/FilterButton"
import FilterModal from "components/FilterModal"
import HomeFooterContainer, { HomeFooterContainerEvent } from "components/HomeFooterContainer"
import HomeSideContainer from "components/HomeSideContainer"
import LnUrlAuthModal from "components/LnUrlAuthModal"
import ReceiveActionsheet from "components/ReceiveActionsheet"
import ReceiveLightningModal from "components/ReceiveLightningModal"
import RecenterButton from "components/RecenterButton"
import ScanNfcModal from "components/ScanNfcModal"
import SendActionsheet from "components/SendActionsheet"
import SendToAddressModal from "components/SendToAddressModal"
import SendLightningModal from "components/SendLightningModal"
import SlidingLocationPanel, { createSlidingUpPanelRef } from "components/SlidingLocationPanel"
import useLayout from "hooks/useLayout"
import { useStore } from "hooks/useStore"
import { autorun } from "mobx"
import { observer } from "mobx-react"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { Dimensions, View } from "react-native"
import MapboxGL, { CameraSettings, OnPressEvent, SymbolLayerStyle } from "@rnmapbox/maps"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import store from "stores/Store"
import { Position } from "@turf/helpers"
import { ChargeSessionStatus } from "types/chargeSession"
import { MAPBOX_API_KEY } from "utils/build"
import { EMAIL_REGEX, IS_ANDROID } from "utils/constants"
import { Log } from "utils/logging"
import styles from "utils/styles"
import { TagEvent } from "react-native-nfc-manager"

const empty = require("assets/empty.png")
const busy = require("assets/busy.png")
const full = require("assets/full.png")

const log = new Log("Home")

const RECEIVE_NFC_SCHEMES = [/^lnurlw:/]
const SEND_NFC_SCHEMES = [/^(lnurlp:|lightning:)/, EMAIL_REGEX]

MapboxGL.setAccessToken(MAPBOX_API_KEY)

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

const defaultSettings: CameraSettings = {
    centerCoordinate: [19.054483, 47.560772],
    zoomLevel: 10
}

interface HomeProps {
    navigation: HomeNavigationProp
}

const Home = ({ navigation }: HomeProps) => {
    const slidingLocationPanelRef = createSlidingUpPanelRef()
    const mapViewRef = useRef<MapboxGL.MapView>(null)
    const [balanceCardRectangle, onBalanceCardLayout] = useLayout()
    const [requestingLocationPermission, setRequestingLocationPermission] = useState(IS_ANDROID)
    const [hasLocationPermission, setHasLocationPermission] = useState(!IS_ANDROID)
    const [locationsShapeSource, setLocationsShapeSource] = useState<any>({ type: "FeatureCollection", features: [] })
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false)
    const [isReceiveActionsheetOpen, setIsReceiveActionsheetOpen] = useState(false)
    const [isReceiveLightningModalVisible, setIsReceiveLightningModalVisible] = useState(false)
    const [isReceiveNfcModalVisible, setIsReceiveNfcModalVisible] = useState(false)
    const [isSendActionsheetOpen, setIsSendActionsheetOpen] = useState(false)
    const [isSendToAddressModalVisible, setIsSendToAddressModalVisible] = useState(false)
    const [isSendLightningModalVisible, setIsSendLightningModalVisible] = useState(false)
    const [isSendNfcModalVisible, setIsSendNfcModalVisible] = useState(false)
    const [centerCoordinate, setCenterCoordinate] = useState<Position>([19.054483, 47.560772])
    const [followUserLocation, setFollowUserLocation] = useState(true)
    const { uiStore, locationStore, sessionStore } = useStore()

    let userCoordinate: Position | null = null

    const onChargeButtonPress = () => {
        navigation.navigate("ChargeDetail")
    }

    const onHomeButtonPress = (event: HomeFooterContainerEvent) => {
        if (event === "send") {
            setIsSendActionsheetOpen(true)
        } else if (event === "qr") {
            navigation.navigate("Scanner")
        } else if (event === "receive") {
            setIsReceiveActionsheetOpen(true)
        }
    }

    const onActionsheetPress = (event: string) => {
        if (event === "send_address") {
            setIsSendToAddressModalVisible(true)
        } else if (event === "send_lightning") {
            setIsSendLightningModalVisible(true)
        } else if (event === "send_nfc") {
            setIsSendNfcModalVisible(true)
        } else if (event === "receive_qr") {
            setIsReceiveLightningModalVisible(true)
        } else if (event === "receive_nfc") {
            setIsReceiveNfcModalVisible(true)
        }
    }

    const onLocationPress = ({ features }: OnPressEvent) => {
        if (features.length) {
            store.locationStore.selectLocation(features[0].properties?.uid, features[0].properties?.country)
        }
    }

    const onMapPress = () => {
        setFollowUserLocation(false)
    }

    const onNfcTag = (tag: TagEvent, payload?: string) => {
        try {
            if (payload) {
                log.debug(payload)
                uiStore.parseIntent(payload)
            }
        } catch (error) {
            log.debug(JSON.stringify(error))
        }
    }

    const onRecenterButtonPress = useCallback(() => {
        setFollowUserLocation(true)

        if (userCoordinate) {
            setCenterCoordinate(userCoordinate)
        }
    }, [centerCoordinate])

    const onRegionDidChange = useCallback(async () => {
        if (mapViewRef.current) {
            const bounds = await mapViewRef.current.getVisibleBounds()

            locationStore.setBounds(bounds)
        }
    }, [mapViewRef])

    const onSlidingLocationPanelHide = () => {
        locationStore.removeSelectedLocation()
    }

    const onUserLocationUpdate = useCallback(
        ({ coords }: MapboxGL.Location) => {
            userCoordinate = [coords.longitude, coords.latitude]

            if (followUserLocation) {
                setCenterCoordinate(userCoordinate)
            }
        },
        [followUserLocation]
    )

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
                onTouchMove={onMapPress}
                ref={mapViewRef}
                style={styles.matchParent}
                styleURL={MapboxGL.StyleURL.Street}
            >
                <MapboxGL.Camera defaultSettings={defaultSettings} centerCoordinate={centerCoordinate} />
                <MapboxGL.UserLocation minDisplacement={1} onUpdate={onUserLocationUpdate} visible={hasLocationPermission} />
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
            <HomeSideContainer top={balanceCardRectangle.y + balanceCardRectangle.height}>
                {sessionStore.status !== ChargeSessionStatus.IDLE && <ChargeButton onPress={onChargeButtonPress} />}
                <FilterButton onPress={() => setIsFilterModalVisible(true)} />
                {!followUserLocation && <RecenterButton onPress={onRecenterButtonPress} />}
            </HomeSideContainer>
            <HomeFooterContainer onPress={onHomeButtonPress} />
            <SlidingLocationPanel ref={slidingLocationPanelRef} onHide={onSlidingLocationPanelHide} />
            <ReceiveActionsheet isOpen={isReceiveActionsheetOpen} onPress={onActionsheetPress} onClose={() => setIsReceiveActionsheetOpen(false)} />
            <SendActionsheet isOpen={isSendActionsheetOpen} onPress={onActionsheetPress} onClose={() => setIsSendActionsheetOpen(false)} />
            <FilterModal isVisible={isFilterModalVisible} onClose={() => setIsFilterModalVisible(false)} />
            <LnUrlAuthModal lnUrlAuthParams={uiStore.lnUrlAuthParams} onClose={() => uiStore.clearLnUrl()} />
            <SendToAddressModal isVisible={isSendToAddressModalVisible} onClose={() => setIsSendToAddressModalVisible(false)} />
            <SendLightningModal isVisible={isSendLightningModalVisible} onClose={() => setIsSendLightningModalVisible(false)} />
            <ScanNfcModal
                isVisible={isSendNfcModalVisible}
                onNfcTag={onNfcTag}
                onClose={() => setIsSendNfcModalVisible(false)}
                schemes={SEND_NFC_SCHEMES}
            />
            <ReceiveLightningModal isVisible={isReceiveLightningModalVisible} onClose={() => setIsReceiveLightningModalVisible(false)} />
            <ScanNfcModal
                isVisible={isReceiveNfcModalVisible}
                onNfcTag={onNfcTag}
                onClose={() => setIsReceiveNfcModalVisible(false)}
                schemes={RECEIVE_NFC_SCHEMES}
            />
        </View>
    )
}

export default observer(Home)

export type { HomeProps }
