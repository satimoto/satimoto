import React, { useEffect, useState } from "react"
import { Dimensions, StyleSheet, View } from "react-native"
import SlidingUpPanel from "rn-sliding-up-panel"
import { Button, useTheme, Heading, VStack, Text, HStack, IconButton } from "native-base"
import Location from "models/Location"
import { Log } from "utils/logging"


const log = new Log("LocationPanel")

interface LocationPanelProps {
    location?: Location
}

const styles = StyleSheet.create({
    slidingUpPanel: {
        flex: 1,
        backgroundColor: "white",
        borderRadius: 30,
        padding: 10
    }
})

const LocationPanel = React.forwardRef(({ location }: LocationPanelProps, ref?: React.LegacyRef<SlidingUpPanel>) => {
    const { colors } = useTheme()
    const [addressLine, setAddressLine] = useState<string>()

    const draggableRange = {
        top: (Dimensions.get("window").height / 4) * 3,
        bottom: 0
    }

    const snappingPoints = [draggableRange.top / 2]

    if (!ref) {
        ref = React.createRef()
    }

    useEffect(() => {
        setAddressLine([location?.postalCode, location?.city].filter((item) => item !== undefined).join(" "))
    }, [location])

    return (
        <SlidingUpPanel draggableRange={draggableRange} height={draggableRange.top - draggableRange.bottom} snappingPoints={snappingPoints} ref={ref}>
            {location && (
                <View style={[styles.slidingUpPanel, { backgroundColor: colors.dark[200] }]}>
                    <HStack alignItems="flex-start" space={3}>
                        <Button borderRadius="full">H</Button>
                        <VStack alignContent="center" flexGrow={5}>
                            <Heading color="white">{location.name}</Heading>
                            <Text color="white" fontSize="md">
                                {location.address}
                            </Text>
                            <Text color="white" fontSize="md">
                                {addressLine}
                            </Text>
                        </VStack>
                        <Button borderRadius="full">R</Button>
                    </HStack>
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