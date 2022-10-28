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
import { IS_ANDROID } from "utils/constants"

const styleSheet = StyleSheet.create({
    progressView: {
        position: "absolute",
        top: 0,
        left: 0,
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
        if (!lightningStore.syncedToChain && !uiStore.tooltipShownSyncing && !showTooltip) {
            setTimeout(() => {
                setShowTooltip(true)
            }, 1000)
        } else if (lightningStore.syncedToChain && showTooltip) {
            setTimeout(() => {
                onTooltipClose()
            }, 5000)
        }
    }, [lightningStore.syncedToChain, uiStore.tooltipShownSyncing])

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
                    isDisabled={isBusy}
                    size="lg"
                    variant="solid"
                    onPress={onPress}
                    icon={<QrCodeIcon />}
                    _icon={{ color: "#ffffff", size: 50 }}
                />
                {isBusy && (
                    <AnimatedCircularProgress lineCap="round" size={74} width={8} fill={value} tintColor="#008ae6" style={styleSheet.progressView} />
                )}
            </View>
        </Tooltip>
    )
}

export default observer(CircularProgressButton)
