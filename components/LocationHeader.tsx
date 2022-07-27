import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons"
import { faRoute } from "@fortawesome/free-solid-svg-icons"
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons"
import { IconButton, HStack, Spacer } from "native-base"
import React from "react"
import LocationModel from "models/location"
import LocationAddress from "components/LocationAddress"

interface LocationHeaderProps {
    location: LocationModel
}

const LocationHeader = ({ location }: LocationHeaderProps) => {
    return (
        <HStack alignItems="flex-start" space={1}>
            <IconButton size="lg" borderRadius="full" icon={<FontAwesomeIcon icon={faHeartRegular} />} _icon={{ color: "#ffffff" }} />
            <LocationAddress location={location} />
            <Spacer />
            <IconButton size="lg" borderRadius="full" icon={<FontAwesomeIcon icon={faRoute} />} _icon={{ color: "#ffffff" }} />
        </HStack>
    )
}

export default LocationHeader
