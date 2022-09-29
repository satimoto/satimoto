import QrCode from "components/QrCode"
import { faShareNodes } from "@fortawesome/free-solid-svg-icons"
import { observer } from "mobx-react"
import React, { useEffect, useState } from "react"
import { Dimensions, Share, StyleSheet } from "react-native"
import { useStore } from "hooks/useStore"
import { HStack, IconButton, Text, useColorModeValue, useTheme, VStack } from "native-base"
import useColor from "hooks/useColor"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"

const styleSheet = StyleSheet.create({
    vStack: {
        position: "relative"
    },
    shareButton: {
        position: "absolute",
        borderColor: "#ffffff",
        bottom: 5,
        right: 5
    }
})

interface CircuitCardProps {}

const CircuitCard = ({}: CircuitCardProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const textColor = useColorModeValue("lightText", "darkText")
    const { settingStore } = useStore()
    const [referralLink, setReferralLink] = useState<string | null>(null)

    const size = (Dimensions.get("window").width - 20) / 2

    const onPress = async () => {
        await Share.share({ message: `Join me on Satimoto and every time you charge your electric vehicle, I receive satoshis!\n\n${referralLink}` })
    }

    useEffect(() => {
        if (settingStore.referralCode) {
            setReferralLink(`https://satimoto.com/circuit/${settingStore.referralCode}`)
        }
    }, [settingStore.referralCode])

    return referralLink ? (
        <HStack alignContent="center" justifyContent="center" space={1}>
            <QrCode value={referralLink} color="white" backgroundColor={backgroundColor} onPress={onPress} size={size} />
            <IconButton
                size="lg"
                borderRadius="full"
                onPress={onPress}
                variant="solid"
                style={styleSheet.shareButton}
                icon={<FontAwesomeIcon icon={faShareNodes} />}
                _icon={{ color: "#ffffff" }}
            />
        </HStack>
    ) : (
        <></>
    )
}

export default observer(CircuitCard)
