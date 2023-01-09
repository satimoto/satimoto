import ExpandableListItem from "components/ExpandableListItem"
import InfoListItem from "components/InfoListItem"
import Modal from "components/Modal"
import SatoshiBalance from "components/SatoshiBalance"
import useColor from "hooks/useColor"
import { observer } from "mobx-react"
import PaymentModel from "models/Payment"
import { useTheme, VStack } from "native-base"
import React from "react"
import Moment from "react-moment"
import { Text } from "react-native"
import { toNumber } from "utils/conversion"

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
                <InfoListItem title="Sent">
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
                {payment.hash ? (
                    <ExpandableListItem title="Hash">
                        <Text style={{ color: textColor, fontSize: 16 }}>{payment.hash}</Text>
                    </ExpandableListItem>
                ) : (
                    <></>
                )}
                {payment.preimage ? (
                    <ExpandableListItem title="Preimage">
                        <Text style={{ color: textColor, fontSize: 16 }}>{payment.preimage}</Text>
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
