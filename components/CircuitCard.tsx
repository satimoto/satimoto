import InfoBox from "components/InfoBox"
import QrCode from "components/QrCode"
import RoundedButton from "components/RoundedButton"
import { faShareNodes } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import useColor from "hooks/useColor"
import { useStore } from "hooks/useStore"
import I18n from "i18n-js"
import { observer } from "mobx-react"
import { HStack, IconButton, Text, useColorModeValue, useTheme } from "native-base"
import React, { useEffect, useState } from "react"
import { Dimensions, Share, StyleSheet, View } from "react-native"

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
    const { settingStore, uiStore } = useStore()
    const [referralLink, setReferralLink] = useState<string | null>(null)

    const size = (Dimensions.get("window").width - 20) / 2

    const onSharePress = async () => {
        await settingStore.requestPushNotificationPermission()

        await Share.share({
            message: `Join me on Satimoto and every time you charge your electric vehicle, I receive satoshis!\n\n#Bitcoin #UsingBitcoin\n\n${referralLink}`
        })
    }

    const onCircuitPress = () => {
        uiStore.setTooltipShown({ circuit: true })
    }

    useEffect(() => {
        if (settingStore.referralCode) {
            setReferralLink(`https://satimoto.com/circuit/${settingStore.referralCode}`)
        }
    }, [settingStore.referralCode])

    return referralLink ? (
        uiStore.tooltipShownCircuit ? (
            <HStack alignContent="center" justifyContent="center" space={1}>
                <QrCode value={referralLink} color="white" backgroundColor={backgroundColor} onPress={onSharePress} size={size} />
                <IconButton
                    size="lg"
                    borderRadius="full"
                    onPress={onSharePress}
                    variant="solid"
                    style={styleSheet.shareButton}
                    icon={<FontAwesomeIcon icon={faShareNodes} />}
                    _icon={{ color: "#ffffff" }}
                />
            </HStack>
        ) : (
            <InfoBox color="white" minHeight={size - 16}>
                <Text color={textColor} alignSelf="center" bold fontSize="lg">{I18n.t("CircuitCard_AboutCircuitTitle")}</Text>
                <Text color={textColor}>{I18n.t("CircuitCard_AboutCircuitText")}</Text>
                <HStack marginTop={2}>
                    <Text flexBasis={0} flexGrow={12} color={textColor}>
                        {I18n.t("CircuitCard_MoreInfoText")}
                    </Text>
                    <View>
                        <RoundedButton marginTop={1} size="md" onPress={onCircuitPress}>
                            {I18n.t("CircuitCard_ButtonText")}
                        </RoundedButton>
                    </View>
                </HStack>
            </InfoBox>
        )
    ) : (
        <></>
    )
}

export default observer(CircuitCard)
