import { useNavigation } from "@react-navigation/native"
import Input from "components/Input"
import BusyButton from "components/BusyButton"
import Modal from "components/Modal"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { FormControl, Text, useColorModeValue, VStack } from "native-base"
import React, { useEffect, useState } from "react"
import { HomeNavigationProp } from "screens/Home"
import I18n from "utils/i18n"
import { bytesToHex, errorToString } from "utils/conversion"

interface ReceiveLightningModalProps {
    isVisible: boolean
    onClose: () => void
}

const ReceiveLightningModal = ({ isVisible, onClose }: ReceiveLightningModalProps) => {
    const errorColor = useColorModeValue("error.300", "error.500")
    const textColor = useColorModeValue("lightText", "darkText")
    const navigation = useNavigation<HomeNavigationProp>()
    const [isBusy, setIsBusy] = useState(false)
    const [isAmountInvalid, setIsAmountInvalid] = useState(true)
    const [amount, setAmount] = useState("")
    const [lastError, setLastError] = useState("")
    const [channelRequestNeeded, setChannelRequestNeeded] = useState(false)
    const { channelStore, invoiceStore } = useStore()

    const onAmountChange = (text: string) => {
        setAmount(text)
    }

    const onConfirmPress = async () => {
        setIsBusy(true)

        try {
            const addInvoiceResponse = await invoiceStore.addInvoice({ value: +amount, createChannel: true })
            const hash = bytesToHex(addInvoiceResponse.rHash)
            const invoice = await invoiceStore.waitForInvoice(hash)

            navigation.navigate("WaitForPayment", { invoice })
            onClose()
        } catch (error) {
            setLastError(errorToString(error))
        }

        setIsBusy(false)
    }

    const onModalClose = () => {
        if (!isBusy) {
            onClose()
        }
    }

    useEffect(() => {
        const amountInt = +amount

        setChannelRequestNeeded(amountInt >= channelStore.remoteBalance)
        setIsAmountInvalid(amountInt <= 0)
    }, [amount])

    useEffect(() => {
        if (!isVisible) {
            setAmount("")
            setLastError("")
            setIsBusy(false)
        }
    }, [isVisible])

    return (
        <Modal isVisible={isVisible} onClose={onModalClose}>
            <VStack alignItems="center" space={5} width="100%">
                <Text color={textColor} fontSize="xl">
                    {I18n.t("ReceiveLightningModal_Title")}
                </Text>
                <FormControl isRequired={true}>
                    <Input value={amount} keyboardType="number-pad" isFullWidth={true} onChangeText={onAmountChange} />
                    {channelRequestNeeded && <FormControl.HelperText>{I18n.t("ReceiveLightningModal_InputAmountWarning")}</FormControl.HelperText>}
                </FormControl>
                {lastError.length > 0 && <Text color={errorColor}>{lastError}</Text>}
                <BusyButton isBusy={isBusy} onPress={onConfirmPress} isDisabled={isAmountInvalid}>
                    {I18n.t("Button_Ok")}
                </BusyButton>
            </VStack>
        </Modal>
    )
}

export default observer(ReceiveLightningModal)
