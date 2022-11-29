import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import ConnectorGroupButton from "components/ConnectorGroupButton"
import LocationHeader from "components/LocationHeader"
import useColor from "hooks/useColor"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { ConnectorGroup } from "models/Connector"
import EvseModel from "models/Evse"
import { useTheme, VStack } from "native-base"
import React, { useCallback, useState } from "react"
import { Dimensions, StyleSheet, View } from "react-native"
import SlidingUpPanel from "rn-sliding-up-panel"
import { AppStackParamList } from "screens/AppStack"
import { Log } from "utils/logging"

const log = new Log("SlidingLocationPanel")

const styles = StyleSheet.create({
    slidingUpPanel: {
        flex: 1,
        backgroundColor: "white",
        borderRadius: 30,
        padding: 10
    }
})

interface SlidingLocationPanelProps {
    onHide?: () => void
}

type SlidingLocationNavigationProp = NativeStackNavigationProp<AppStackParamList, "Home">

const SlidingLocationPanel = React.forwardRef(({ onHide }: SlidingLocationPanelProps, ref?: React.LegacyRef<SlidingUpPanel>) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const navigation = useNavigation<SlidingLocationNavigationProp>()
    const [allowDragging, setAllowDragging] = useState(true)
    const { locationStore } = useStore()

    const draggableRange = {
        top: (Dimensions.get("window").height / 4) * 3,
        bottom: 0
    }

    const snappingPoints = [draggableRange.top / 2]

    if (!ref) {
        ref = React.createRef()
    }

    const onConnectorPress = useCallback((connectorGroup: ConnectorGroup, evses: EvseModel[]) => {
        if (evses.length > 1) {
            navigation.navigate("EvseList", { location: locationStore.selectedLocation!, evses, connectorGroup })
        } else {
            const evse = evses[0]
            const connector = evse.connectors.find(
                (connector) => connectorGroup.standard === connector.standard && connectorGroup.wattage === connector.wattage
            )

            if (connector) {
                navigation.navigate("ConnectorDetail", { location: locationStore.selectedLocation!, evse, connector })
            }
        }
    }, [navigation, locationStore.selectedLocation])

    const onConnectorPressIn = () => setAllowDragging(false)
    const onConnectorPressOut = () => setAllowDragging(true)

    return (
        <SlidingUpPanel
            draggableRange={draggableRange}
            height={draggableRange.top - draggableRange.bottom}
            snappingPoints={snappingPoints}
            ref={ref}
            onHide={onHide}
            allowDragging={allowDragging}
            backdropStyle={{ alignItems: "flex-start" }}
        >
            {locationStore.selectedLocation && (
                <View style={[styles.slidingUpPanel, { backgroundColor }]}>
                    <VStack space={3}>
                        <LocationHeader location={locationStore.selectedLocation} />
                        {locationStore.selectedConnectors.map((connectorGroup) => (
                            <ConnectorGroupButton
                                key={`${connectorGroup.standard}:${connectorGroup.wattage}`}
                                connectorGroup={connectorGroup}
                                evses={connectorGroup.evses}
                                onPress={onConnectorPress}
                                onPressIn={onConnectorPressIn}
                                onPressOut={onConnectorPressOut}
                            />
                        ))}
                    </VStack>
                </View>
            )}
        </SlidingUpPanel>
    )
})

const createSlidingUpPanelRef = () => {
    return React.createRef<SlidingUpPanel>()
}

export default observer(SlidingLocationPanel)
export { createSlidingUpPanelRef }
