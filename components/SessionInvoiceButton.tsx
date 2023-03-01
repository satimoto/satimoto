import ButtonIcon from "components/ButtonIcon"
import SessionInvoiceBadge from "components/SessionInvoiceBadge"
import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import SatoshiBalance from "components/SatoshiBalance"
import useColor from "hooks/useColor"
import SessionInvoiceModel from "models/SessionInvoice"
import { HStack, Spacer, Text, useTheme, VStack } from "native-base"
import React, { useState } from "react"
import { transactionIcons } from "utils/assets"
import { toSatoshi } from "utils/conversion"
import styles from "utils/styles"
import { observer } from "mobx-react"
import TimeAgo from "react-native-timeago"

interface SessionInvoiceButtonProps {
    sessionInvoice: SessionInvoiceModel
}

const SessionInvoiceButton = ({ sessionInvoice }: SessionInvoiceButtonProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.gray[500], colors.warmGray[50])
    const [totalSat] = useState(toSatoshi(sessionInvoice.totalMsat).toNumber())

    return (
        <TouchableOpacityOptional style={[styles.listButton, { backgroundColor }]}>
            <HStack alignItems="center" space={1}>
                <ButtonIcon source={transactionIcons["MINUS"]} style={[styles.buttonIcon, { paddingHorizontal: 6 }]}>
                    <SessionInvoiceBadge sessionInvoice={sessionInvoice} />
                </ButtonIcon>
                <VStack flexBasis={0} flexGrow={12}>
                    <Text color="white" fontSize="lg" fontWeight="bold" isTruncated={true}>
                        {sessionInvoice.paymentRequest}
                    </Text>
                    <Text color="gray.300" fontSize="lg">
                        <TimeAgo time={sessionInvoice.lastUpdated} />
                    </Text>
                </VStack>
                <Spacer />
                <VStack alignItems="flex-end">
                    <SatoshiBalance size={18} color={"#ffffff"} satoshis={totalSat} />
                    <Text />
                </VStack>
            </HStack>
        </TouchableOpacityOptional>
    )
}

export default observer(SessionInvoiceButton)
