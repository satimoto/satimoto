import locationJson from "assets/locations.json"
import BalanceCard from "components/BalanceCard"
import HomeButtonContainer, { HomeButtonContainerEvent } from "components/HomeButtonContainer"
import LnUrlAuthModal from "components/LnUrlAuthModal"
import LocationPanel, { createRef } from "components/LocationPanel"
import SendToAddressModal from "components/SendToAddressModal"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import LocationModel from "models/location"
import React, { useEffect, useState } from "react"
import { Dimensions, View } from "react-native"
import MapboxGL, { OnPressEvent, SymbolLayerStyle } from "@react-native-mapbox-gl/maps"
import { AppStackParamList } from "screens/AppStack"
import { IS_ANDROID } from "utils/constants"
import { Log } from "utils/logging"
import styles from "utils/styles"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"

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

locationJson.forEach((location) => {
    features.push({
        id: location.ID,
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [location.AddressInfo.Longitude, location.AddressInfo.Latitude]
        },
        properties: {
            uuid: location.UUID,
            name: location.AddressInfo.Title,
            address: location.AddressInfo.AddressLine1,
            city: location.AddressInfo.Town,
            postalCode: location.AddressInfo.Postcode,
            busyConnections: Math.floor(Math.random() * (location.Connections.length + 1)),
            totalConnections: location.Connections.length,
            connectors: location.Connections.map((connection) => {
                return {
                    id: connection.ID.toString(),
                    connectorId: connection.ConnectionTypeID,
                    ...connectorTypes[0],
                    ...connectorTypes[connection.ConnectionTypeID],
                    voltage: connection.PowerKW
                }
            })
        }
    })
})

const symbolLayer: SymbolLayerStyle = {
    iconAnchor: "bottom",
    iconAllowOverlap: true,
    iconImage: [
        "case",
        ["==", ["get", "busyConnections"], 0],
        "empty",
        ["==", ["get", "busyConnections"], ["get", "totalConnections"]],
        "full",
        "busy"
    ],
    iconSize: 0.5,
    textAnchor: "bottom",
    textOffset: [0, -1.5],
    textColor: "#ffffff",
    textField: ["to-string", ["-", ["get", "totalConnections"], ["get", "busyConnections"]]]
}

export type HomeNavigationProp = NativeStackNavigationProp<AppStackParamList, "Home">

interface HomeProps {
    navigation: HomeNavigationProp
}

const Home = ({ navigation }: HomeProps) => {
    const locationPanelRef = createRef()
    const [requestingLocationPermission, setRequestingLocationPermission] = useState(IS_ANDROID)
    const [hasLocationPermission, setHasLocationPermission] = useState(!IS_ANDROID)
    const [locations, setLocations] = useState<any>({ type: "FeatureCollection", features: features })
    const [location, setLocation] = useState<LocationModel>()
    const [isSendToAddressModalVisible, setIsSendToAddressModalVisible] = useState(false)
    const { uiStore } = useStore()

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
            setLocation(features[0].properties as LocationModel)
        }
        log.debug(JSON.stringify(features))
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
        if (location) {
            locationPanelRef.current?.show({ toValue: Dimensions.get("window").height / 2, velocity: 0.1 })
        } else {
            locationPanelRef.current?.hide()
        }
    }, [location])

    return (
        <View style={styles.matchParent}>
            <MapboxGL.MapView
                attributionEnabled={false}
                compassEnabled={false}
                logoEnabled={false}
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
                <MapboxGL.ShapeSource id="locationsShapeSource" onPress={onLocationPress} shape={locations}>
                    <MapboxGL.SymbolLayer id="locationsSymbolLayer" style={symbolLayer} />
                </MapboxGL.ShapeSource>
            </MapboxGL.MapView>
            <BalanceCard />
            <HomeButtonContainer onPress={onHomeButtonPress}/>
            <LocationPanel location={location} ref={locationPanelRef} />
            <LnUrlAuthModal lnUrlAuthParams={uiStore.lnUrlAuthParams} onClose={() => uiStore.clearLnUrl()} />
            <SendToAddressModal isVisible={isSendToAddressModalVisible} onClose={() => setIsSendToAddressModalVisible(false)} />
        </View>
    )
}

export default observer(Home)

export type { HomeProps }
