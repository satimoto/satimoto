import useColor from "hooks/useColor"
import { useTheme } from "native-base"
import React, { PropsWithChildren } from "react"
import { StyleSheet, View } from "react-native"
import RNModal from "react-native-modal"
import styles from "utils/styles"

const styleSheet = StyleSheet.create({
    modal: {
        borderRadius: 15,
        padding: 20
    }
})

interface ModalProps extends PropsWithChildren<any> {
    isVisible: boolean
    onClose: () => void
}

const Modal = ({ children, isVisible, onClose }: ModalProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])

    return (
        <RNModal backdropOpacity={0.3} isVisible={isVisible} onBackButtonPress={onClose} onBackdropPress={onClose}>
            <View style={[styles.center, styleSheet.modal, { backgroundColor }]}>
                {children}
            </View>
        </RNModal>
    )
}

export default Modal
