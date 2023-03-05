import AddressCard from "components/AddressCard"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons"
import { faRoute } from "@fortawesome/free-solid-svg-icons"
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons"
import PointModel from "models/Geometry"
import { IconButton, HStack, Spacer } from "native-base"
import React, { useCallback } from "react"
import { launchRouteIntent } from "utils/routeIntent"

interface AddressHeaderProps {
    name: string
    geom: PointModel
    address?: string
    city?: string
    postalCode?: string
    onFavoritePress?: () => void
    onPressIn?: () => void
    onPressOut?: () => void
}

const AddressHeader = ({
    name,
    geom,
    address,
    city,
    postalCode,
    onFavoritePress = () => {},
    onPressIn = () => {},
    onPressOut = () => {}
}: AddressHeaderProps) => {
    const onRoutePress = useCallback(() => {
        if (geom) {
            launchRouteIntent(geom.coordinates[1], geom.coordinates[0])
        }
    }, [geom])

    return (
        <HStack alignItems="flex-start" space={1}>
            <IconButton
                size="lg"
                borderRadius="full"
                isDisabled={true}
                onPress={onFavoritePress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                icon={<FontAwesomeIcon icon={faHeartRegular} />}
                _icon={{ color: "#ffffff" }}
            />
            <AddressCard name={name} address={address} city={city} postalCode={postalCode} />
            <Spacer />
            <IconButton
                size="lg"
                borderRadius="full"
                onPress={onRoutePress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                icon={<FontAwesomeIcon icon={faRoute} />}
                _icon={{ color: "#ffffff" }}
            />
        </HStack>
    )
}

export default AddressHeader
