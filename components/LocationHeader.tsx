import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons"
import { faRoute } from "@fortawesome/free-solid-svg-icons"
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons"
import { IconButton, HStack, Spacer } from "native-base"
import React from "react"
import LocationModel from "models/location"
import LocationAddress from "components/LocationAddress"
import { launchRouteIntent } from "utils/routeIntent"
import { locale } from "moment"

interface LocationHeaderProps {
    location: LocationModel
}

const LocationHeader = ({ location }: LocationHeaderProps) => {
    const onRoutePress = () => {
        launchRouteIntent(location.geom.coordinates[1], location.geom.coordinates[0])
    }

    return (
        <HStack alignItems="flex-start" space={1}>
            <IconButton
                size="lg"
                borderRadius="full"
                isDisabled={true}
                icon={<FontAwesomeIcon icon={faHeartRegular} />}
                _icon={{ color: "#ffffff" }}
            />
            <LocationAddress location={location} />
            <Spacer />
            <IconButton size="lg" borderRadius="full" icon={<FontAwesomeIcon icon={faRoute} />} onPress={onRoutePress} _icon={{ color: "#ffffff" }} />
        </HStack>
    )
}

export default LocationHeader
