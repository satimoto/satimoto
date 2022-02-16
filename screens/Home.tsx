import React, { useEffect, useState } from "react"
import { View } from "react-native"
import { useTheme } from "@react-navigation/native"
import MapboxGL, { SymbolLayerStyle } from "@react-native-mapbox-gl/maps"
import BalanceCard from "components/BalanceCard"
import HomeButtonContainer from "components/HomeButtonContainer"
import { Log } from "utils/logging"
import locationJson from "assets/locations.json"
import { IS_ANDROID } from "utils/constants"
import styles from "utils/styles"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const empty = require("assets/empty.png")
const busy = require("assets/busy.png")
const full = require("assets/full.png")

const log = new Log("Home")

MapboxGL.setAccessToken("pk.eyJ1Ijoic2F0aW1vdG8iLCJhIjoiY2t6bzlpajQxMzV5MzJwbnI0bW0zOW1waSJ9.RXvZaqPLk3xNagAQ-BAfQg")

let features: any[] = []

locationJson.forEach((location) => {
    features.push({
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [location.AddressInfo.Longitude, location.AddressInfo.Latitude]
        },
        properties: {
            uuid: location.UUID,
            busyConnections: Math.floor(Math.random() * (location.Connections.length + 1)),
            totalConnections: location.Connections.length
        }
    })
})

log.debug(JSON.stringify(features, undefined, 2))

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

const Home = () => {
    const { colors } = useTheme()
    const [requestingLocationPermission, setRequestingLocationPermission] = useState(IS_ANDROID)
    const [hasLocationPermission, setHasLocationPermission] = useState(!IS_ANDROID)
    const [locations, setLocations]: [any, any] = useState({ type: "FeatureCollection", features: features })

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

    return (
        <View style={styles.matchParent}>
            <MapboxGL.MapView attributionEnabled={false} logoEnabled={false} style={styles.matchParent} styleURL={MapboxGL.StyleURL.Street}>
                {includeCamera()}
                <MapboxGL.Images
                    images={{
                        busy,
                        empty,
                        full
                    }}
                />
                <MapboxGL.ShapeSource id="exampleShapeSource" shape={locations}>
                    <MapboxGL.SymbolLayer id="exampleIconName" style={symbolLayer} />
                </MapboxGL.ShapeSource>
            </MapboxGL.MapView>
            <BalanceCard />
            <HomeButtonContainer />
        </View>
    )
}

export default Home
