import { observer } from "mobx-react"
import ChannelModel from "models/Channel"
import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import SatoshiBalance from "components/SatoshiBalance"
import useColor from "hooks/useColor"
import { HStack, Spacer, Text, useColorModeValue, useTheme, VStack } from "native-base"
import React from "react"
import I18n from "utils/i18n"
import styles from "utils/styles"

interface ChannelButtonProps {
    channel: ChannelModel
    onPress?: (channel: ChannelModel) => void
}

const ChannelButton = ({ channel, onPress = () => {} }: ChannelButtonProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.gray[500], colors.warmGray[50])
    const primaryTextcolor = useColorModeValue("lightText", "darkText")
    const secondaryTextcolor = useColorModeValue("warmGray.200", "dark.200")

    const onButtonPress = () => {
        onPress(channel)
    }

    return (
        <TouchableOpacityOptional onPress={onButtonPress} style={[styles.transactionButton, styles.buttonMinHeight, { backgroundColor }]}>
            <HStack alignItems="center" space={1}>
                <VStack>
                    <Text color={primaryTextcolor} fontSize="lg" fontWeight="bold">
                        {channel.channelPoint.substring(0, 16)}
                    </Text>
                    <Text color={secondaryTextcolor} fontSize="lg">
                        {channel.isClosed ? I18n.t("Label_Closed") : channel.closingTxid ? I18n.t("Label_Closing") : I18n.t("Label_Open")}
                    </Text>
                </VStack>
                <Spacer />
                <VStack alignItems="flex-end">
                    <SatoshiBalance size={18} color={"#ffffff"} satoshis={channel.capacity} />
                </VStack>
            </HStack>
        </TouchableOpacityOptional>
    )
}

export default observer(ChannelButton)
