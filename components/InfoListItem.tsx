import { HStack, Spacer, Text, useColorModeValue, VStack } from "native-base"
import React, { PropsWithChildren } from "react"

interface InfoListItemProps extends PropsWithChildren<any> {
    title: string
}

const InfoListItem = ({ title, children }: InfoListItemProps) => {
    const textColor = useColorModeValue("lightText", "darkText")

    return (
        <HStack alignItems="center" space={1}>
            <VStack>
                <Text color={textColor} fontSize="lg" fontWeight="bold">
                    {title}
                </Text>
            </VStack>
            <Spacer />
            <VStack alignItems="flex-end">{children}</VStack>
        </HStack>
    )
}

export default InfoListItem
