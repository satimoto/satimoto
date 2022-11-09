import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import useColor from "hooks/useColor"
import I18n from "i18n-js"
import TokenModel from "models/Token"
import { HStack, Spacer, Text, useTheme, VStack } from "native-base"
import React from "react"
import { GestureResponderEvent } from "react-native"
import styles from "utils/styles"

interface TokenButtonProps {
    token: TokenModel
    onPress?: (token: TokenModel, event: GestureResponderEvent) => void
}

const TokenButton = ({ token, onPress = () => {} }: TokenButtonProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.gray[500], colors.warmGray[50])

    const onButtonPress = (event: GestureResponderEvent) => {
        onPress(token, event)
    }

    return (
        <TouchableOpacityOptional onPress={onButtonPress} style={[styles.listButton, { backgroundColor }]}>
            <HStack alignItems="center" space={1}>
                <VStack>
                    <Text color="white" fontSize="lg" fontWeight="bold">
                        {token.visualNumber}
                    </Text>
                    <Text color="gray.300" fontSize="lg">
                        {I18n.t("TokenButton_Subtitle")}
                    </Text>
                </VStack>
                <Spacer />
            </HStack>
        </TouchableOpacityOptional>
    )
}

export default TokenButton
