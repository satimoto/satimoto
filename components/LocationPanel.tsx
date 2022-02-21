import ConnectorButton from "components/ConnectorButton"
import LocationHeader from "components/LocationHeader"
import Location from "models/Location"
import { useTheme, VStack } from "native-base"
import React from "react"
import { Dimensions, StyleSheet, View } from "react-native"
import SlidingUpPanel from "rn-sliding-up-panel"
import { Log } from "utils/logging"

const log = new Log("LocationPanel")

const styles = StyleSheet.create({
    slidingUpPanel: {
        flex: 1,
        backgroundColor: "white",
        borderRadius: 30,
        padding: 10,
        paddingTop: 100
    }
})

interface LocationPanelProps {
    location?: Location
}

const LocationPanel = React.forwardRef(({ location }: LocationPanelProps, ref?: React.LegacyRef<SlidingUpPanel>) => {
    const { colors } = useTheme()

    const draggableRange = {
        top: (Dimensions.get("window").height / 4) * 3,
        bottom: 0
    }

    const snappingPoints = [draggableRange.top / 2]

    if (!ref) {
        ref = React.createRef()
    }

    return (
        <SlidingUpPanel draggableRange={draggableRange} height={draggableRange.top - draggableRange.bottom} snappingPoints={snappingPoints} ref={ref}>
            {location && (
                <View style={[styles.slidingUpPanel, { backgroundColor: colors.dark[200] }]}>
                    <LocationHeader location={location} />
                    <VStack space={3}>
                        {location.connectors.map((connector) => (
                            <ConnectorButton key={connector.id} connector={connector} />
                        ))}
                    </VStack>
                </View>
            )}
        </SlidingUpPanel>
    )
})

const createRef = () => {
    return React.createRef<SlidingUpPanel>()
}

export default LocationPanel
export { createRef }
