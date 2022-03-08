import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons"
import { faRoute } from "@fortawesome/free-solid-svg-icons"
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons"
import { IconButton, VStack, Heading, Text } from "native-base"
import React, { useEffect, useState } from "react"
import { View } from "react-native"
import LocationModel from "models/location"

interface LocationHeaderProps {
    location: LocationModel
}

const LocationHeader = ({ location }: LocationHeaderProps) => {
    const [addressLine, setAddressLine] = useState<string>()

    useEffect(() => {
        setAddressLine([location?.postalCode, location?.city].filter((item) => item !== undefined).join(" "))
    }, [location])

    return (
        <>
            <View style={{ position: "absolute", top: 10, left: 10 }}>
                <IconButton size="lg" borderRadius="full" icon={<FontAwesomeIcon icon={faHeartRegular} />} _icon={{ color: "#ffffff" }} />
            </View>
            <View style={{ position: "absolute", top: 15, left: 60, right: 60 }}>
                <VStack alignContent="center">
                    <Heading color="white" isTruncated={true} allowFontScaling={true}>
                        {location.name}
                    </Heading>
                    <Text color="white" fontSize="md">
                        {location.address}
                    </Text>
                    <Text color="white" fontSize="md">
                        {addressLine}
                    </Text>
                </VStack>
            </View>
            <View style={{ position: "absolute", top: 10, right: 10 }}>
                <IconButton size="lg" borderRadius="full" icon={<FontAwesomeIcon icon={faRoute} />} _icon={{ color: "#ffffff" }} />
            </View>
        </>
    )
}

export default LocationHeader
