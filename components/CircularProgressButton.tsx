import { QrCodeIcon } from "@bitcoin-design/bitcoin-icons-react-native/outline"
import useColor from "hooks/useColor"
import { useStore } from "hooks/useStore"
import I18n from "i18n-js"
import { observer } from "mobx-react"
import { IconButton, Text, useColorModeValue, useTheme } from "native-base"
import React, { useEffect, useState } from "react"
import { Dimensions, GestureResponderEvent, StatusBar, StyleProp, StyleSheet, View, ViewStyle } from "react-native"
import { AnimatedCircularProgress } from "react-native-circular-progress"
import Tooltip from "react-native-walkthrough-tooltip"
import { LightningBackend } from "types/lightningBackend"
import { IS_ANDROID } from "utils/constants"

const styleSheet = StyleSheet.create({
    progressView: {
        position: "absolute",
        top: 2,
        left: 2,
        bottom: 0,
        right: 0
    }
})

interface CircularProgressButtonProps {
    isBusy: boolean
    value: number
    onPress?: (event: GestureResponderEvent) => void
    style?: StyleProp<ViewStyle>
}

const CircularProgressButton = ({ isBusy, value, onPress = () => {}, style = {} }: CircularProgressButtonProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.gray[700], colors.warmGray[50])
    const textColor = useColorModeValue("lightText", "darkText")
    const [showTooltip, setShowTooltip] = useState(false)
    const { lightningStore, uiStore } = useStore()
    const { width } = Dimensions.get("window")

    const onTooltipClose = () => {
        setShowTooltip(false)
        uiStore.setTooltipShown({ syncing: true })
    }

    useEffect(() => {
        if (uiStore.showSyncing) {
            if (!lightningStore.syncedToChain && !uiStore.tooltipShownSyncing && !showTooltip) {
                setTimeout(() => {
                    setShowTooltip(true)
                }, 1000)
            } else if (lightningStore.syncedToChain && showTooltip) {
                setTimeout(() => {
                    onTooltipClose()
                }, 5000)
            }
        }
    }, [lightningStore.syncedToChain, uiStore.showSyncing, uiStore.tooltipShownSyncing])

    return (
        <Tooltip
            isVisible={showTooltip}
            placement="top"
            onClose={onTooltipClose}
            disableShadow={true}
            topAdjustment={IS_ANDROID && StatusBar.currentHeight ? -StatusBar.currentHeight : 0}
            contentStyle={{ backgroundColor, borderRadius: 10, maxWidth: (width / 3) * 2 }}
            content={
                <Text textAlign="center" color={textColor} fontSize="md" flexWrap="wrap" bold>
                    {I18n.t("CircularProgressButton_TooltipText")}
                </Text>
            }
        >
            <View style={style}>
                <IconButton
                    borderRadius="full"
                    size="lg"
                    variant="solid"
                    onPress={onPress}
                    icon={<QrCodeIcon />}
                    _icon={{ color: "#ffffff", size: 50 }}
                />
                {isBusy && (
                    <AnimatedCircularProgress
                        lineCap="round"
                        rotation={0}
                        size={70}
                        width={4}
                        fill={value}
                        backgroundColor="#006bb4"
                        tintColor="#f1f1f1"
                        style={styleSheet.progressView}
                        onPress={onPress}
                    />
                )}
            </View>
        </Tooltip>
    )
}

export default observer(CircularProgressButton)
