import ButtonIcon from "components/ButtonIcon"
import InvoiceRequestBadge from "components/InvoiceRequestBadge"
import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import SatoshiBalance from "components/SatoshiBalance"
import useColor from "hooks/useColor"
import InvoiceRequestModel from "models/InvoiceRequest"
import { HStack, Spacer, Text, useTheme, VStack } from "native-base"
import React, { useState } from "react"
import { transactionIcons } from "utils/assets"
import { toSatoshi } from "utils/conversion"
import styles from "utils/styles"
import { observer } from "mobx-react"
import TimeAgo from "react-native-timeago"

interface InvoiceRequestButtonProps {
    invoiceRequest: InvoiceRequestModel
}

const InvoiceRequestButton = ({ invoiceRequest }: InvoiceRequestButtonProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.gray[500], colors.warmGray[50])
    const [totalSat] = useState(toSatoshi(invoiceRequest.totalMsat).toNumber())

    return (
        <TouchableOpacityOptional style={[styles.transactionButton, { backgroundColor }]}>
            <HStack alignItems="center" space={1}>
                <ButtonIcon source={transactionIcons["PLUS"]} style={[styles.buttonIcon, { paddingHorizontal: 6 }]}>
                    <InvoiceRequestBadge invoiceRequest={invoiceRequest} />
                </ButtonIcon>
                <VStack>
                    <Text color="white" fontSize="lg" fontWeight="bold" isTruncated={true}>
                        {invoiceRequest.promotion.code}
                    </Text>
                    <Text color="gray.300" fontSize="lg">
                        {invoiceRequest.releaseDate && <TimeAgo time={invoiceRequest.releaseDate} />}
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

export default observer(InvoiceRequestButton)
