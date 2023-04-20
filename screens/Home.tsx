import BalanceCard from "components/BalanceCard"
import ChargeButton from "components/ChargeButton"
import ConfirmationModal from "components/ConfirmationModal"
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
import SlidingLocationPanel, { createSlidingLocationPanelRef } from "components/SlidingLocationPanel"
import SlidingPoiPanel, { createSlidingPoiPanelRef } from "components/SlidingPoiPanel"
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
import { ASSET_IMAGES, EMAIL_REGEX, IS_ANDROID } from "utils/constants"
import I18n from "utils/i18n"
import { Log } from "utils/logging"
import styles from "utils/styles"
import { TagEvent } from "react-native-nfc-manager"
import { LightningBackend } from "types/lightningBackend"
import { CommonActions } from "@react-navigation/native"

const empty = require("assets/empty.png")
const busy = require("assets/busy.png")
const full = require("assets/full.png")

const log = new Log("Home")

const RECEIVE_NFC_SCHEMES = [/^lnurlw:/]
const SEND_NFC_SCHEMES = [/^(lnurlp:|lightning:)/, EMAIL_REGEX]

MapboxGL.setAccessToken(MAPBOX_API_KEY)

const locationsSymbolLayer: SymbolLayerStyle = {
    iconAnchor: "bottom",
    iconAllowOverlap: true,
    iconImage: ["case", ["==", ["get", "availableEvses"], ["get", "totalEvses"]], "empty", ["==", ["get", "availableEvses"], 0], "full", "busy"],
    iconSize: 0.5,
    textAnchor: "bottom",
    textOffset: [0, -1.5],
    textColor: "#ffffff",
    textField: ["to-string", ["get", "availableEvses"]]
}

const poisSymbolLayer: SymbolLayerStyle = {
    iconAnchor: "center",
    iconImage: ["coalesce", ["concat", ["get", "tagKey"], "_", ["get", "tagValue"]], ["get", "tagKey"]],
    iconSize: 0.3
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
    const slidingLocationPanelRef = createSlidingLocationPanelRef()
    const slidingPoiPanelRef = createSlidingPoiPanelRef()
    const mapViewRef = useRef<MapboxGL.MapView>(null)
    const [balanceCardRectangle, onBalanceCardLayout] = useLayout()
    const [centerCoordinate, setCenterCoordinate] = useState<Position>([19.054483, 47.560772])
    const [followUserLocation, setFollowUserLocation] = useState(true)
    const [hasLocationPermission, setHasLocationPermission] = useState(!IS_ANDROID)
    const [locationsShapeSource, setLocationsShapeSource] = useState<any>({ type: "FeatureCollection", features: [] })
    const [poisShapeSource, setPoisShapeSource] = useState<any>({ type: "FeatureCollection", features: [] })
    const [isBackendTooltipVisible, setIsBackendTooltipVisible] = useState(false)
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false)
    const [isReceiveActionsheetOpen, setIsReceiveActionsheetOpen] = useState(false)
    const [isReceiveLightningModalVisible, setIsReceiveLightningModalVisible] = useState(false)
    const [isReceiveNfcModalVisible, setIsReceiveNfcModalVisible] = useState(false)
    const [isSendActionsheetOpen, setIsSendActionsheetOpen] = useState(false)
    const [isSendToAddressModalVisible, setIsSendToAddressModalVisible] = useState(false)
    const [isSendLightningModalVisible, setIsSendLightningModalVisible] = useState(false)
    const [isSendNfcModalVisible, setIsSendNfcModalVisible] = useState(false)
    const [isSyncingTooltipVisible, setIsSyncingTooltipVisible] = useState(false)
    const [requestingLocationPermission, setRequestingLocationPermission] = useState(IS_ANDROID)
    const { uiStore, lightningStore, locationStore, sessionStore } = useStore()

    let userCoordinate: Position | null = null

    const onChargeButtonPress = () => {
        navigation.navigate("ChargeDetail")
    }

    const onHomeButtonPress = (event: HomeFooterContainerEvent) => {
        if (lightningStore.syncedToChain) {
            if (event === "send") {
                setIsSendActionsheetOpen(true)
            } else if (event === "qr") {
                navigation.navigate("Scanner")
            } else if (event === "receive") {
                setIsReceiveActionsheetOpen(true)
            }
        } else {
            setIsSyncingTooltipVisible(true)
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

    const onPoiPress = ({ features }: OnPressEvent) => {
        if (features.length) {
            store.locationStore.selectPoi(features[0].properties?.uid)
        }
    }

    const onMapPress = () => {
        setFollowUserLocation(false)
    }

    const onNfcTag = (tag: TagEvent, payload?: string) => {
        try {
            if (payload) {
                log.debug(`SAT006 onNfcTag: ${payload}`, true)
                uiStore.parseIntent(payload)
            }
        } catch (error) {
            log.debug(`SAT007 onNfcTag: ${JSON.stringify(error)}`, true)
        }
    }

    const onOpenSettingsPress = useCallback(() => {
        uiStore.setTooltipShown({ backend: true })

        navigation.dispatch((state) => {
            const pushedRoutes = [
                ...state.routes,
                { name: "SettingsAdvanced" },
                { name: "SettingsBackends" },
                { name: "SettingsBackend", params: { backend: LightningBackend.BREEZ_SDK } }
            ]

            return CommonActions.reset({ ...state, routes: pushedRoutes, index: pushedRoutes.length - 1 })
        })
    }, [])

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
        locationStore.deselectLocation()
    }

    const onSlidingPoiPanelHide = () => {
        locationStore.deselectPoi()
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
        if (locationStore.selectedLocation) {
            slidingLocationPanelRef.current?.show({ toValue: Dimensions.get("window").height / 2, velocity: 0.1 })
        } else {
            slidingLocationPanelRef.current?.hide()
        }
    }, [locationStore.selectedLocation])

    useEffect(() => {
        if (locationStore.selectedPoi) {
            slidingPoiPanelRef.current?.show({ toValue: 350, velocity: 0.1 })
        } else {
            slidingPoiPanelRef.current?.hide()
        }
    }, [locationStore.selectedPoi])

    useEffect(() => {
        if (uiStore.tooltipShownBackend) {
            setIsBackendTooltipVisible(false)
        } else {
            setIsBackendTooltipVisible(true)
        }
    }, [uiStore.tooltipShownBackend])

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
        locationStore.startLocationUpdates()

        return () => locationStore.stopLocationUpdates()
    }, [])

    useEffect(() => {
        autorun(() => {
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
        })

        autorun(() => {
            setPoisShapeSource({
                type: "FeatureCollection",
                features: locationStore.pois.map((poi) => {
                    return {
                        id: poi.uid,
                        type: "Feature",
                        geometry: poi.geom,
                        properties: poi
                    }
                })
            })
        })
    }, [])

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
                    nativeAssetImages={ASSET_IMAGES}
                />
                <MapboxGL.ShapeSource id="poisShapeSource" onPress={onPoiPress} shape={poisShapeSource}>
                    <MapboxGL.SymbolLayer id="poisSymbolLayer" style={poisSymbolLayer} />
                </MapboxGL.ShapeSource>
                <MapboxGL.ShapeSource id="locationsShapeSource" onPress={onLocationPress} shape={locationsShapeSource}>
                    <MapboxGL.SymbolLayer id="locationsSymbolLayer" style={locationsSymbolLayer} />
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
            <SlidingPoiPanel ref={slidingPoiPanelRef} onHide={onSlidingPoiPanelHide} />
            <ReceiveActionsheet isOpen={isReceiveActionsheetOpen} onPress={onActionsheetPress} onClose={() => setIsReceiveActionsheetOpen(false)} />
            <SendActionsheet isOpen={isSendActionsheetOpen} onPress={onActionsheetPress} onClose={() => setIsSendActionsheetOpen(false)} />
            <ConfirmationModal
                text={I18n.t("ConfirmationModal_BackendTooltipTitle")}
                subtext={I18n.t("ConfirmationModal_BackendTooltipText")}
                buttonText={I18n.t("Button_OpenSettings")}
                isVisible={isBackendTooltipVisible}
                onClose={async () => uiStore.setTooltipShown({ backend: true })}
                onPress={async () => onOpenSettingsPress()}
            />
            <ConfirmationModal
                text={I18n.t("CircularProgressButton_TooltipText")}
                buttonText={I18n.t("Button_Ok")}
                isVisible={isSyncingTooltipVisible}
                onClose={async () => setIsSyncingTooltipVisible(false)}
                onPress={async () => setIsSyncingTooltipVisible(false)}
            />
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
