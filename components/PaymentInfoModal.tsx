import ExpandableListItem from "components/ExpandableListItem"
import IconButton from "components/IconButton"
import InfoListItem from "components/InfoListItem"
import Modal from "components/Modal"
import SatoshiBalance from "components/SatoshiBalance"
import { faCopy } from "@fortawesome/free-solid-svg-icons"
import useColor from "hooks/useColor"
import { observer } from "mobx-react"
import PaymentModel from "models/Payment"
import { HStack, Text, useTheme, VStack } from "native-base"
import React from "react"
import Moment from "react-moment"
import Clipboard from "@react-native-clipboard/clipboard"
import { toNumber } from "utils/conversion"
import I18n from "utils/i18n"

interface PaymentInfoModalProps {
    payment?: PaymentModel
    onClose: () => void
}

const PaymentInfoModal = ({ payment, onClose }: PaymentInfoModalProps) => {
    const { colors } = useTheme()
    const textColor = useColor(colors.lightText, colors.darkText)

    return payment ? (
        <Modal isVisible={true} onClose={onClose}>
            <VStack space={5} width="100%">
                <InfoListItem title="Amount">
                    <SatoshiBalance size={18} color={textColor} satoshis={toNumber(payment.valueSat)} />
                </InfoListItem>
                <InfoListItem title="Fee">
                    <SatoshiBalance size={18} color={textColor} satoshis={toNumber(payment.feeSat)} />
                </InfoListItem>
                <InfoListItem title="Created At">
                    <Moment element={Text} style={{ color: textColor, fontSize: 18 }} format="L LT">
                        {payment.createdAt}
                    </Moment>
                </InfoListItem>
                {payment.description ? (
                    <ExpandableListItem title="Description">
                        <Text style={{ color: textColor, fontSize: 16 }}>{payment.description}</Text>
                    </ExpandableListItem>
                ) : (
                    <></>
                )}
                {payment.failureReasonKey ? (
                    <ExpandableListItem title="Failure Reason">
                        <Text style={{ color: textColor, fontSize: 16 }}>
                            {I18n.t(payment.failureReasonKey, { defaultValue: payment.failureReasonKey })}
                        </Text>
                    </ExpandableListItem>
                ) : (
                    <></>
                )}
                {payment.preimage ? (
                    <ExpandableListItem title="Preimage">
                        <HStack alignItems="center">
                            <Text style={{ color: textColor, fontSize: 16 }} marginRight={5}>
                                {payment.preimage}
                            </Text>
                            <IconButton icon={faCopy} size="sm" onPress={() => Clipboard.setString(payment.preimage!)} />
                        </HStack>
                    </ExpandableListItem>
                ) : (
                    <></>
                )}
                {payment.hash ? (
                    <ExpandableListItem title="Hash">
                        <HStack alignItems="center">
                            <Text style={{ color: textColor, fontSize: 16 }} marginRight={5}>
                                {payment.hash}
                            </Text>
                            <IconButton icon={faCopy} size="sm" onPress={() => Clipboard.setString(payment.hash)} />
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

export default observer(PaymentInfoModal)
