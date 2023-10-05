import BusyButton from "components/BusyButton"
import ExpandableInfoItem from "components/ExpandableInfoItem"
import Input from "components/Input"
import Modal from "components/Modal"
import { useNavigation } from "@react-navigation/native"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { FormControl, HStack, Text, useColorModeValue, VStack } from "native-base"
import React, { useEffect, useState } from "react"
import { HomeNavigationProp } from "screens/Home"
import { errorToString, toSatoshi } from "utils/conversion"
import I18n from "utils/i18n"

interface ReceiveLightningModalProps {
    isVisible: boolean
    onClose: () => void
}

const ReceiveLightningModal = ({ isVisible, onClose }: ReceiveLightningModalProps) => {
    const errorColor = useColorModeValue("error.300", "error.500")
    const textColor = useColorModeValue("lightText", "darkText")
    const secondaryTextColor = useColorModeValue("warmGray.200", "dark.200")
    const navigation = useNavigation<HomeNavigationProp>()
    const [isBusy, setIsBusy] = useState(false)
    const [isAmountInvalid, setIsAmountInvalid] = useState(true)
    const [amount, setAmount] = useState("")
    const [lastError, setLastError] = useState("")
    const [channelOpeningNotAllowed, setChannelOpeningNotAllowed] = useState(false)
    const [channelRequestNeeded, setChannelRequestNeeded] = useState(false)
    const [openingFee, setOpeningFee] = useState(0)
    const [lspFeeProportional, setLspFeeProportional] = useState(0)
    const [lspFeeMinimum, setLspFeeMinimum] = useState(0)
    const { channelStore, invoiceStore } = useStore()

    const onAmountChange = (text: string) => {
        setAmount(text)
    }

    const onConfirmPress = async () => {
        setIsBusy(true)

        try {
            const invoice = await invoiceStore.addInvoice({ value: +amount, createChannel: true })
            const lnInvoice = invoiceStore.findInvoice(invoice.hash)

            if (lnInvoice) {
                navigation.navigate("WaitForPayment", { invoice: lnInvoice })
                onClose()
            }
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

    const updateLspFees = async (amountSats: number) => {
        const lspFees = await channelStore.getLspFees(amountSats)

        setOpeningFee(toSatoshi(lspFees.feeMsat).toNumber())
        setLspFeeMinimum(toSatoshi(lspFees.usedFeeParams?.minMsat || 0).toNumber())
        setLspFeeProportional(lspFees.usedFeeParams?.proportional || 0)
    }

    useEffect(() => {
        const amountNumber = +amount
        let openingNotAllowed = false

        if (amountNumber > 0 && amountNumber >= channelStore.remoteBalance) {
            updateLspFees(amountNumber)
            openingNotAllowed = channelStore.lspOpeningNotAllowed
        }

        setChannelOpeningNotAllowed(openingNotAllowed)
        setChannelRequestNeeded(amountNumber > 0 && amountNumber >= channelStore.remoteBalance && !openingNotAllowed)
        setIsAmountInvalid(amountNumber <= 0 || openingNotAllowed)
    }, [amount, channelStore.lspOpeningNotAllowed, channelStore.remoteBalance])

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
                    {channelOpeningNotAllowed && (
                        <HStack alignItems="center">
                            <Text color={secondaryTextColor} fontSize="xs">
                                {I18n.t("ReceiveLightning_OpeningNotAllowed", {
                                    name: channelStore.lspName,
                                    altBackend: I18n.t("BREEZ_SDK")
                                })}
                            </Text>
                        </HStack>
                    )}
                    {channelRequestNeeded && (
                        <ExpandableInfoItem title={I18n.t("ReceiveLightning_OpeningFeeText", { fee: openingFee })}>
                            <HStack alignItems="center">
                                <Text color={secondaryTextColor} fontSize="xs">
                                    {I18n.t("ReceiveLightning_FeeInfoText", {
                                        name: channelStore.lspName,
                                        minimumFee: lspFeeMinimum,
                                        percentFee: lspFeeProportional / 10000
                                    })}
                                </Text>
                            </HStack>
                        </ExpandableInfoItem>
                    )}
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
