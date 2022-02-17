import React, { useEffect, useState } from "react"
import { Dimensions, View } from "react-native"
import { useTheme } from "@react-navigation/native"
import MapboxGL, { OnPressEvent, SymbolLayerStyle } from "@react-native-mapbox-gl/maps"
import BalanceCard from "components/BalanceCard"
import HomeButtonContainer from "components/HomeButtonContainer"
import LocationPanel, { createRef } from "components/LocationPanel"
import { Log } from "utils/logging"
import locationJson from "assets/locations.json"
import { IS_ANDROID } from "utils/constants"
import styles from "utils/styles"
import Location from "models/location"

const empty = require("assets/empty.png")
const busy = require("assets/busy.png")
const full = require("assets/full.png")

const log = new Log("Home")

MapboxGL.setAccessToken("pk.eyJ1Ijoic2F0aW1vdG8iLCJhIjoiY2t6bzlpajQxMzV5MzJwbnI0bW0zOW1waSJ9.RXvZaqPLk3xNagAQ-BAfQg")

let features: any[] = []

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
    const [locations, setLocations] = useState<any>({ type: "FeatureCollection", features: features })
    const [location, setLocation] = useState<Location>()
    const locationPanelRef = createRef()

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
            locationPanelRef.current?.show({toValue: Dimensions.get("window").height / 2, velocity: 0.1})
        } else {
            locationPanelRef.current?.hide()
        }
    }, [location])

    const onPress = ({coordinates, features}: OnPressEvent) => {
        log.debug(JSON.stringify(coordinates))
        
        if (features.length) {
            setLocation(features[0].properties as Location)
        }
        log.debug(JSON.stringify(features))
    }

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
            <MapboxGL.MapView attributionEnabled={false} compassEnabled={false} logoEnabled={false} style={styles.matchParent} styleURL={MapboxGL.StyleURL.Street}>
                {includeCamera()}
                <MapboxGL.Images
                    images={{
                        busy,
                        empty,
                        full
                    }}
                />
                <MapboxGL.ShapeSource id="locationsShapeSource" onPress={onPress} shape={locations}>
                    <MapboxGL.SymbolLayer id="locationsSymbolLayer" style={symbolLayer} />
                </MapboxGL.ShapeSource>
            </MapboxGL.MapView>
            <BalanceCard />
            <HomeButtonContainer />
            <LocationPanel location={location} ref={locationPanelRef}/>
        </View>
    )
}

export default Home
