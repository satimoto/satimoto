import { VStack, Heading, Text} from "native-base"
import React, { useEffect, useState } from "react"
import LocationModel from "models/Location"
import { FlexAlignType } from "react-native"

interface LocationAddressProps {
    location: LocationModel
    alignItems?: FlexAlignType
}

const LocationAddress = ({ location, alignItems }: LocationAddressProps) => {
    const [addressLine, setAddressLine] = useState<string>()

    useEffect(() => {
        setAddressLine([location?.postalCode, location?.city].filter((item) => item !== undefined).join(" "))
    }, [location])

    return (
        <VStack alignContent="center" alignItems={alignItems} flexShrink={2}>
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
    )
}

export default LocationAddress
