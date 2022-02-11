import React from "react"
import { StyleSheet, Text, View } from "react-native"
import { useTheme } from "@react-navigation/native"
import { SafeAreaView } from "react-native-safe-area-context"
import MapboxGL from "@react-native-mapbox-gl/maps"
import BalanceCard from "components/BalanceCard"

MapboxGL.setAccessToken("pk.eyJ1IjoiYWdyaXN0YSIsImEiOiJjaXdlcjAwMnEwMDQ2MnRrNGUycmo5Ym5zIn0.PzmdvMAwzbAfDHOq5sruOQ")

const styles = StyleSheet.create({
    page: {
        flex: 1
    },
    map: {
        flex: 1,
        flexGrow: 1,
        flexDirection: "column",
        justifyContent: "space-between"
    },
    chrome: {
        flex: 1,
        flexGrow: 1,
        flexDirection: "column",
        justifyContent: "space-between"
    },
    balanceCard: {
        margin: 10,
        marginTop: 0
    },
    footer: {
        marginTop: "auto",
        margin: 10,
        marginBottom: 0,
        backgroundColor: "white"
    },
    icon: {
        color: "#ffffff"
    }
})

const Home = () => {
    const { colors } = useTheme()

    return (
        <MapboxGL.MapView attributionEnabled={false} logoEnabled={false} style={styles.map} styleURL={MapboxGL.StyleURL.Street}>
            <MapboxGL.Camera followUserLocation />
            <SafeAreaView style={styles.chrome}>
                <BalanceCard style={styles.balanceCard} />
                <View style={styles.footer}>
                    <Text>Footer</Text>
                </View>
            </SafeAreaView>
        </MapboxGL.MapView>
    )
}

export default Home
