import { faCalculator, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { Badge, HStack, Text } from "native-base"
import React from "react"

interface ChargeInfoProps {
    metered: number
    estimated: number
    unit: string
    colorScheme?: string
    marginTop?: number
}

const ChargeInfo = ({ metered, estimated, unit, colorScheme, marginTop = 0 }: ChargeInfoProps) => {
    return (
        <HStack alignItems="center" justifyContent="center" marginTop={marginTop}>
            <Badge variant="outline" borderRadius="full" colorScheme={colorScheme} padding={2}>
                <HStack alignItems="center" justifyContent="center" space={1}>
                    <Text color="#ffffff" fontSize={14} fontWeight={600}>{metered === 0 ? "-" : metered}</Text>
                    <FontAwesomeIcon icon={faMagnifyingGlass} color="#ffffff" size={14} />
                </HStack>
            </Badge>
            <Text color="#ffffff" fontSize={14} paddingX={5}>
                {unit}
            </Text>
            <Badge variant="outline" borderRadius="full" colorScheme={colorScheme} padding={2}>
                <HStack alignItems="center" justifyContent="center" space={1}>
                    <Text color="#ffffff" fontSize={14} fontWeight={600}>{estimated === 0 ? "-" : estimated}</Text>
                    <FontAwesomeIcon icon={faCalculator} color="#ffffff" size={14} />
                </HStack>
            </Badge>
        </HStack>
    )
}

export default ChargeInfo
