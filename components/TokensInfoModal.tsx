import Modal from "components/Modal"
import RoundedButton from "components/RoundedButton"
import I18n from "i18n-js"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faCircle } from "@fortawesome/free-solid-svg-icons"
import { observer } from "mobx-react"
import { HStack, Text, useColorModeValue, VStack } from "native-base"
import React from "react"
import { MINIMUM_RFID_CHARGE_BALANCE } from "utils/constants"
import styles from "utils/styles"

interface TokensInfoModalProps {
    isVisible: boolean
    onPress: () => void
    onClose: () => void
}

const TokensInfoModal = ({ isVisible, onPress, onClose }: TokensInfoModalProps) => {
    const primaryTextColor = useColorModeValue("lightText", "darkText")
    const secondaryTextColor = useColorModeValue("warmGray.200", "dark.200")

    return (
        <Modal isVisible={isVisible} onClose={onClose}>
            <VStack alignItems="flex-start" space={5} width="100%">
                <Text color={primaryTextColor} fontSize="xl">
                    {I18n.t("TokensInfoModal_Text")}
                </Text>
                <HStack>
                    <FontAwesomeIcon icon={faCircle} color="#ffffff" size={10} style={styles.bulletPadding} />
                    <Text color={secondaryTextColor} fontSize="lg" marginRight={16}>
                        {I18n.t("TokensInfoModal_SyncedText")}
                    </Text>
                </HStack>
                <HStack>
                    <FontAwesomeIcon icon={faCircle} color="#ffffff" size={10} style={styles.bulletPadding} />
                    <Text color={secondaryTextColor} fontSize="lg" marginRight={16}>
                        {I18n.t("TokensInfoModal_FundedText", { satoshis: MINIMUM_RFID_CHARGE_BALANCE })}
                    </Text>
                </HStack>
            </VStack>
            <VStack alignItems="center" space={5} width="100%" marginTop={5}>
                <RoundedButton onPress={onPress}>{I18n.t("Button_Ok")}</RoundedButton>
            </VStack>
        </Modal>
    )
}

export default observer(TokensInfoModal)
