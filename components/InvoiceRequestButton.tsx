import ButtonIcon from "components/ButtonIcon"
import InvoiceRequestBadge from "components/InvoiceRequestBadge"
import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import SatoshiBalance from "components/SatoshiBalance"
import useColor from "hooks/useColor"
import { observer } from "mobx-react"
import InvoiceRequestModel from "models/InvoiceRequest"
import { HStack, Spacer, Text, useTheme, VStack } from "native-base"
import React, { useState } from "react"
import { transactionIcons } from "utils/assets"
import { toSatoshi } from "utils/conversion"
import I18n from "utils/i18n"
import styles from "utils/styles"

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
                        {I18n.t(`PROMOTION_${invoiceRequest.promotion.code}_TITLE`, { defaultValue: invoiceRequest.promotion.code })}
                    </Text>
                    <Text color="gray.300" fontSize="lg">
                        {I18n.t(`PROMOTION_${invoiceRequest.promotion.code}_TEXT`, { defaultValue: "" })}
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
