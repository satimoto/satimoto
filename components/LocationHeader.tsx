import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons"
import { faRoute } from "@fortawesome/free-solid-svg-icons"
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons"
import { IconButton, VStack, Heading, Text, HStack, Spacer } from "native-base"
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
        <HStack alignItems="flex-start" space={1}>
            <IconButton size="lg" borderRadius="full" icon={<FontAwesomeIcon icon={faHeartRegular} />} _icon={{ color: "#ffffff" }} />
            <VStack alignContent="center" flexShrink={2}>
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
            <Spacer />
            <IconButton size="lg" borderRadius="full" icon={<FontAwesomeIcon icon={faRoute} />} _icon={{ color: "#ffffff" }} />
        </HStack>
    )
}

export default LocationHeader
