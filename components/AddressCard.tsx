import { VStack, Heading, Text } from "native-base"
import React, { useEffect, useState } from "react"
import { FlexAlignType } from "react-native"

interface AddressCardProps {
    name: string
    address?: string
    city?: string
    postalCode?: string
    alignItems?: FlexAlignType
}

const AddressCard = ({ name, address, city, postalCode, alignItems }: AddressCardProps) => {
    const [addressLine, setAddressLine] = useState<string>("")

    useEffect(() => {
        setAddressLine([postalCode, city].filter((item) => item !== undefined).join(" "))
    }, [city, postalCode])

    return (
        <VStack alignContent="center" alignItems={alignItems} flexShrink={2}>
            <Heading color="white" isTruncated={true} allowFontScaling={true}>
                {name}
            </Heading>
            {address && (
                <Text color="white" fontSize="md">
                    {address}
                </Text>
            )}
            {addressLine.length > 0 && (
                <Text color="white" fontSize="md">
                    {addressLine}
                </Text>
            )}
        </VStack>
    )
}

export default AddressCard
