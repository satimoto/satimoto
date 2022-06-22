import BusySpinner from "components/BusySpinner"
import ConnectorButton from "components/ConnectorButton"
import LocationHeader from "components/LocationHeader"
import useColor from "hooks/useColor"
import ConnectorModel from "models/Connector"
import EvseModel from "models/Evse"
import { LocationModelLike } from "models/Location"
import { useTheme, VStack } from "native-base"
import React, { useEffect, useState } from "react"
import { Dimensions, StyleSheet, View } from "react-native"
import SlidingUpPanel from "rn-sliding-up-panel"
import { getLocation } from "services/SatimotoService"
import { Log } from "utils/logging"

const log = new Log("SlidingLocationPanel")

const styles = StyleSheet.create({
    slidingUpPanel: {
        flex: 1,
        backgroundColor: "white",
        borderRadius: 30,
        padding: 10,
        paddingTop: 100
    }
})

interface AvailableConnector extends ConnectorModel {
    evses: EvseModel[]
    availableConnectors: number
    totalConnectors: number
}

interface AvailableConnectors {
    [type: string]: AvailableConnector
}

interface SlidingLocationPanelProps {
    locationUid?: string
    onHide?: () => void
}

const SlidingLocationPanel = React.forwardRef(
    ({ locationUid, onHide }: SlidingLocationPanelProps, ref?: React.LegacyRef<SlidingUpPanel>) => {
        const { colors } = useTheme()
        const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
        const [isBusy, setIsBusy] = useState<boolean>(false)
        const [location, setLocation] = useState<LocationModelLike>()
        const [connectors, setConnectors] = useState<AvailableConnectors>({})

        const draggableRange = {
            top: (Dimensions.get("window").height / 4) * 3,
            bottom: 0
        }

        const snappingPoints = [draggableRange.top / 2]

        if (!ref) {
            ref = React.createRef()
        }

        const onLocationUidChange = async () => {
            if (locationUid) {
                setIsBusy(true)

                try {
                    const getLocationResult = await getLocation(locationUid)
                    const evses: EvseModel[] = getLocationResult.data.getLocation.evses
                    const connectors = evses.reduce((availableConnectors: AvailableConnectors, evse: EvseModel) => {
                        return evse.connectors.reduce((availableConnectors: AvailableConnectors, connector: ConnectorModel) => {
                            availableConnectors[connector.standard] = availableConnectors[connector.standard] || {
                                ...connector,
                                availableConnectors: 0,
                                totalConnectors: 0,
                                evses: []
                            }

                            if (evse.status === "AVAILABLE") {
                                availableConnectors[connector.standard].evses.push(evse)
                                availableConnectors[connector.standard].availableConnectors++
                            }

                            availableConnectors[connector.standard].totalConnectors++

                            return availableConnectors
                        }, availableConnectors)
                    }, {})

                    setConnectors(connectors)
                    setLocation(getLocationResult.data.getLocation as LocationModelLike)
                } catch {}

                setIsBusy(false)
            }
        }

        useEffect(() => {
            if (locationUid) {
                onLocationUidChange()
            } else {
                setLocation(undefined)
            }
        }, [locationUid])

        return (
            <SlidingUpPanel
                draggableRange={draggableRange}
                height={draggableRange.top - draggableRange.bottom}
                snappingPoints={snappingPoints}
                ref={ref}
                onHide={onHide}
            >
                <BusySpinner isBusy={isBusy}>
                    {location && (
                        <View style={[styles.slidingUpPanel, { backgroundColor }]}>
                            <LocationHeader location={location} />
                            <VStack space={3}>
                                {Object.keys(connectors).map((key) => (
                                    <ConnectorButton key={connectors[key].uid} connector={connectors[key]} />
                                ))}
                            </VStack>
                        </View>
                    )}
                </BusySpinner>
            </SlidingUpPanel>
        )
    }
)

const createRef = () => {
    return React.createRef<SlidingUpPanel>()
}

export default SlidingLocationPanel
export { createRef }
