import BusyButton from "components/BusyButton"
import Modal from "components/Modal"
import { useStore } from "hooks/useStore"
import I18n from "i18n-js"
import { observer } from "mobx-react"
import { HStack, Text, useColorModeValue, VStack } from "native-base"
import React, { useState } from "react"

interface ClearTransactionsModalProps {
    isVisible: boolean
    onClose: () => void
}

const ClearTransactionsModal = ({ isVisible, onClose }: ClearTransactionsModalProps) => {
    const textColor = useColorModeValue("lightText", "darkText")
    const [isFailedBusy, setFailedIsBusy] = useState(false)
    const [isAllBusy, setAllIsBusy] = useState(false)
    const { transactionStore } = useStore()

    const onAllPress = async () => {
        setAllIsBusy(true)
        transactionStore.clearTransactions()
        onClose()
        setAllIsBusy(false)
    }

    const onFailedPress = async () => {
        setFailedIsBusy(true)
        onClose()
        transactionStore.clearFailedTransactions()
        setFailedIsBusy(false)
    }

    return (
        <Modal isVisible={isVisible} onClose={onClose}>
            <VStack alignItems="center" space={5} width="100%">
                <Text color={textColor} fontSize="xl">
                    {I18n.t("ClearTransactionsModal_Text")}
                </Text>
                <HStack space={5}>
                    <BusyButton isBusy={isFailedBusy} isDisabled={isAllBusy} onPress={onFailedPress}>
                        {I18n.t("ClearTransactionsModal_ClearFailedText")}
                    </BusyButton>
                    <BusyButton isBusy={isAllBusy} isDisabled={isFailedBusy} onPress={onAllPress}>
                        {I18n.t("ClearTransactionsModal_ClearAllText")}
                    </BusyButton>
                </HStack>
            </VStack>
        </Modal>
    )
}

export default observer(ClearTransactionsModal)
