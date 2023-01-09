import ExpandableListItem from "components/ExpandableListItem"
import InfoListItem from "components/InfoListItem"
import Modal from "components/Modal"
import SatoshiBalance from "components/SatoshiBalance"
import useColor from "hooks/useColor"
import { observer } from "mobx-react"
import InvoiceModel from "models/Invoice"
import { useTheme, VStack } from "native-base"
import React from "react"
import Moment from "react-moment"
import { Text } from "react-native"
import { toNumber } from "utils/conversion"

interface InvoiceInfoModalProps {
    invoice?: InvoiceModel
    onClose: () => void
}

const InvoiceInfoModal = ({ invoice, onClose }: InvoiceInfoModalProps) => {
    const { colors } = useTheme()
    const textColor = useColor(colors.lightText, colors.darkText)

    return invoice ? (
        <Modal isVisible={true} onClose={onClose}>
            <VStack space={5} width="100%">
                <InfoListItem title="Receive">
                    <SatoshiBalance size={18} color={textColor} satoshis={toNumber(invoice.valueSat)} />
                </InfoListItem>
                <InfoListItem title="Created At">
                    <Moment element={Text} style={{ color: textColor, fontSize: 18 }} format="L LT">
                        {invoice.createdAt}
                    </Moment>
                </InfoListItem>
                {invoice.description ? (
                    <ExpandableListItem title="Description">
                        <Text style={{ color: textColor, fontSize: 16 }}>{invoice.description}</Text>
                    </ExpandableListItem>
                ) : (
                    <></>
                )}
                {invoice.preimage ? (
                    <ExpandableListItem title="Preimage">
                        <Text style={{ color: textColor, fontSize: 16 }}>{invoice.preimage}</Text>
                    </ExpandableListItem>
                ) : (
                    <></>
                )}
                {invoice.hash ? (
                    <ExpandableListItem title="Hash">
                        <Text style={{ color: textColor, fontSize: 16 }}>{invoice.hash}</Text>
                    </ExpandableListItem>
                ) : (
                    <></>
                )}
            </VStack>
        </Modal>
    ) : (
        <></>
    )
}

export default observer(InvoiceInfoModal)
