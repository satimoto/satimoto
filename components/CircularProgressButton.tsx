import { QrCodeIcon } from "@bitcoin-design/bitcoin-icons-react-native/outline"
import { IconButton } from "native-base"
import React from "react"
import { GestureResponderEvent, StyleProp, StyleSheet, View, ViewStyle } from "react-native"
import { AnimatedCircularProgress } from "react-native-circular-progress"

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
    return (
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
                <AnimatedCircularProgress
                    lineCap="round"
                    size={74}
                    width={8}
                    fill={value}
                    tintColor="#008ae6"
                    style={styleSheet.progressView}
                />
            )}
        </View>
    )
}

export default CircularProgressButton
