import useColor from "hooks/useColor"
import { LNURLAuthParams } from "js-lnurl"
import { Button, Spinner, Text, useColorModeValue, useTheme, VStack } from "native-base"
import React, { useState } from "react"
import { StyleSheet, View } from "react-native"
import Modal from "react-native-modal"
import { authenticate } from "services/LnUrlService"
import styles from "utils/styles"

const styleSheet = StyleSheet.create({
    modal: {
        borderRadius: 15,
        padding: 20
    }
})

interface LnUrlAuthModalProps {
    lnUrlAuthParams?: LNURLAuthParams
    onClose: () => void
}

const LnUrlAuthModal = ({ lnUrlAuthParams, onClose }: LnUrlAuthModalProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const textColor = useColorModeValue("lightText", "darkText")
    const [loginBusy, setLoginBusy] = useState(false)

    const onLoginPress = async () => {
        setLoginBusy(true)
        await authenticate(lnUrlAuthParams!)
        onClose()
        setLoginBusy(false)
    }

    const onModalClose = () => {
        if (!loginBusy) {
            onClose()
        }
    }

    return lnUrlAuthParams ? (
        <Modal backdropOpacity={0.3} isVisible={true} onBackButtonPress={onModalClose} onBackdropPress={onModalClose}>
            <View style={[styles.center, styleSheet.modal, { backgroundColor }]}>
                <VStack alignItems="center">
                    <Text color={textColor} fontSize="xl">
                        Do you want to login to
                    </Text>
                    <Text color={textColor} fontSize="xl" fontWeight="bold">
                        {lnUrlAuthParams.domain}
                    </Text>
                    {loginBusy ? (
                        <Spinner marginTop={10} size="lg" />
                    ) : (
                        <Button marginTop={10} onPress={onLoginPress}>
                            Login
                        </Button>
                    )}
                </VStack>
            </View>
        </Modal>
    ) : (
        <></>
    )
}

export default LnUrlAuthModal
