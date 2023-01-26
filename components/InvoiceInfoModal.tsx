import ExpandableListItem from "components/ExpandableListItem"
import IconButton from "components/IconButton"
import InfoListItem from "components/InfoListItem"
import Modal from "components/Modal"
import SatoshiBalance from "components/SatoshiBalance"
import { faCopy } from "@fortawesome/free-solid-svg-icons"
import useColor from "hooks/useColor"
import { observer } from "mobx-react"
import InvoiceModel from "models/Invoice"
import { HStack, Text, useTheme, VStack } from "native-base"
import React from "react"
import Moment from "react-moment"
import Clipboard from "@react-native-clipboard/clipboard"
import { toNumber } from "utils/conversion"
import I18n from "utils/i18n"

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
                <InfoListItem title="Amount">
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
                {invoice.failureReasonKey ? (
                    <ExpandableListItem title="Failure Reason">
                        <Text style={{ color: textColor, fontSize: 16 }}>{I18n.t(invoice.failureReasonKey)}</Text>
                    </ExpandableListItem>
                ) : (
                    <></>
                )}
                {invoice.preimage ? (
                    <ExpandableListItem title="Preimage">
                        <HStack alignItems="center">
                            <Text style={{ color: textColor, fontSize: 16 }} marginRight={5}>
                                {invoice.preimage}
                            </Text>
                            <IconButton icon={faCopy} size="sm" onPress={() => Clipboard.setString(invoice.preimage)} />
                        </HStack>
                    </ExpandableListItem>
                ) : (
                    <></>
                )}
                {invoice.hash ? (
                    <ExpandableListItem title="Hash">
                        <HStack alignItems="center">
                            <Text style={{ color: textColor, fontSize: 16 }} marginRight={5}>
                                {invoice.hash}
                            </Text>
                            <IconButton icon={faCopy} size="sm" onPress={() => Clipboard.setString(invoice.hash)} />
                        </HStack>
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
