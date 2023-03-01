import SatoshiBalance from "components/SatoshiBalance"
import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import useColor from "hooks/useColor"
import Long from "long"
import SessionModel from "models/Session"
import { HStack, Spacer, Text, useColorModeValue, useTheme, VStack } from "native-base"
import React, { useEffect, useState } from "react"
import { GestureResponderEvent } from "react-native"
import { toSatoshi } from "utils/conversion"
import styles from "utils/styles"

interface SessionButtonProps {
    session: SessionModel
    onPress?: (session: SessionModel, event: GestureResponderEvent) => void
}

const SessionButton = ({ session, onPress = () => {} }: SessionButtonProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.gray[500], colors.warmGray[50])
    const primaryTextColor = useColorModeValue("lightText", "darkText")
    const secondaryTextColor = useColorModeValue("warmGray.200", "dark.200")
    const [locationName, setLocationName] = useState("")
    const [locationAddress, setLocationAddress] = useState("")
    const [total, setTotal] = useState(0)

    const onButtonPress = (event: GestureResponderEvent) => {
        onPress(session, event)
    }

    useEffect(() => {
        const { location } = session

        if (location) {
            setLocationName(location.name)
            setLocationAddress(location.address || "")
        }
    }, [session.location])

    useEffect(() => {
        const { sessionInvoices } = session

        if (sessionInvoices) {
            const totalMsat = sessionInvoices.reduce((totalMsat, sessionInvoice) => {
                return totalMsat.add(sessionInvoice.totalMsat)
            }, new Long(0))

            setTotal(toSatoshi(totalMsat).toNumber())
        }
    }, [session.sessionInvoices])

    return (
        <TouchableOpacityOptional onPress={onButtonPress} style={[styles.listButton, { backgroundColor }]}>
            <HStack alignItems="center" space={1}>
                <VStack flexBasis={0} flexGrow={12}>
                    <Text color={primaryTextColor} isTruncated={true} fontSize="lg" fontWeight="bold">
                        {locationName}
                    </Text>
                    <Text color={secondaryTextColor} fontSize="lg">
                        {locationAddress}
                    </Text>
                </VStack>
                <Spacer />
                {total > 0 && (
                    <VStack>
                        <SatoshiBalance size={18} color={"#ffffff"} satoshis={total} />
                        <Text color={secondaryTextColor} fontSize="lg" textAlign="right"></Text>
                    </VStack>
                )}
            </HStack>
        </TouchableOpacityOptional>
    )
}

export default SessionButton
