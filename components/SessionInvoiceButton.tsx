import ButtonIcon from "components/ButtonIcon"
import SessionInvoiceBadge from "components/SessionInvoiceBadge"
import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import SatoshiBalance from "components/SatoshiBalance"
import useColor from "hooks/useColor"
import { useStore } from "hooks/useStore"
import I18n from "i18n-js"
import SessionInvoiceModel from "models/SessionInvoice"
import { HStack, Spacer, Text, useTheme, VStack } from "native-base"
import React, { useState } from "react"
import { GestureResponderEvent } from "react-native"
import { transactionIcons } from "utils/assets"
import { toSatoshi } from "utils/conversion"
import styles from "utils/styles"
import { observer } from "mobx-react"

interface SessionInvoiceButtonItemProps {
    sessionInvoice: SessionInvoiceModel
}

const SessionInvoiceButtonItem = ({ sessionInvoice }: SessionInvoiceButtonItemProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.gray[500], colors.warmGray[50])
    const [totalSat] = useState(toSatoshi(sessionInvoice.totalMsat).toNumber())
    const [isBusy, setIsBusy] = useState(false)
    const { sessionStore } = useStore()

    return (
        <TouchableOpacityOptional disabled={isBusy} style={[styles.transactionButton, { backgroundColor }]}>
            <HStack alignItems="center" space={1}>
                <ButtonIcon source={transactionIcons["MINUS"]} style={[styles.buttonIcon, {paddingHorizontal: 6}]}>
                     <SessionInvoiceBadge sessionInvoice={sessionInvoice} />
                </ButtonIcon>
                <VStack>
                    <Text color="white" fontSize="lg" fontWeight="bold">
                        {I18n.t("SessionInvoiceButton_PaymentDueText")}
                    </Text>
                    <Text color="gray.300" fontSize="lg">
                        {I18n.t(isBusy ? "SessionInvoiceButton_PayingText": "SessionInvoiceButton_TapToPayText")}
                    </Text>
                </VStack>
                <Spacer />
                <VStack alignItems="flex-end">
                    <SatoshiBalance size={18} color={"#ffffff"} satoshis={totalSat} />
                </VStack>
            </HStack>
        </TouchableOpacityOptional>
    )
}

export default observer(SessionInvoiceButtonItem)
