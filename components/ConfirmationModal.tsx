import BusyButton from "components/BusyButton"
import Modal from "components/Modal"
import { observer } from "mobx-react"
import { Text, useColorModeValue, VStack } from "native-base"
import { ResponsiveValue } from "native-base/lib/typescript/components/types"
import { IFontSize } from "native-base/lib/typescript/theme/base/typography"
import React, { PropsWithChildren, useState } from "react"

interface ConfirmationModalProps extends PropsWithChildren<any> {
    isVisible: boolean
    text?: string
    textSize?: ResponsiveValue<IFontSize | number | (string & {})>
    subtext?: string
    buttonText: string
    onClose: () => void
    onPress: () => Promise<void>
}

const ConfirmationModal = ({ isVisible, children, text, textSize = "xl", subtext, buttonText, onClose, onPress }: ConfirmationModalProps) => {
    const textColor = useColorModeValue("lightText", "darkText")
    const [isBusy, setIsBusy] = useState(false)

    const onConfirmPress = async () => {
        setIsBusy(true)

        try {
            await onPress()
        } catch {}

        setIsBusy(false)
    }

    return (
        <Modal isVisible={isVisible} onClose={onClose}>
            <VStack alignItems="center" space={5} width="100%">
                {children}
                {text && (
                    <Text color={textColor} fontSize={textSize}>
                        {text}
                    </Text>
                )}
                {subtext && (
                    <Text color={textColor} fontSize="md">
                        {subtext}
                    </Text>
                )}
                <BusyButton isBusy={isBusy} onPress={onConfirmPress}>
                    {buttonText}
                </BusyButton>
            </VStack>
        </Modal>
    )
}

export default observer(ConfirmationModal)
