import Modal from "components/Modal"
import RoundedButton from "components/RoundedButton"
import I18n from "i18n-js"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faCircle } from "@fortawesome/free-solid-svg-icons"
import { observer } from "mobx-react"
import { HStack, Text, useColorModeValue, VStack } from "native-base"
import React from "react"
import { StyleSheet } from "react-native"
import { MINIMUM_RFID_CHARGE_BALANCE } from "utils/constants"

const styleSheet = StyleSheet.create({
    bulletPadding: {
        marginTop: 10,
        marginRight: 16
    }
})

interface TokensInfoModalProps {
    isVisible: boolean
    onPress: () => void
    onClose: () => void
}

const TokensInfoModal = ({ isVisible, onPress, onClose }: TokensInfoModalProps) => {
    const primaryTextcolor = useColorModeValue("lightText", "darkText")
    const secondaryTextcolor = useColorModeValue("warmGray.200", "dark.200")

    return (
        <Modal isVisible={isVisible} onClose={onClose}>
            <VStack alignItems="flex-start" space={5} width="100%">
                <Text color={primaryTextcolor} fontSize="xl">
                    {I18n.t("TokensInfoModal_Text")}
                </Text>
                <HStack>
                    <FontAwesomeIcon icon={faCircle} color="#ffffff" size={10} style={styleSheet.bulletPadding} />
                    <Text color={secondaryTextcolor} fontSize="lg" marginRight={16}>
                        {I18n.t("TokensInfoModal_SyncedText")}
                    </Text>
                </HStack>
                <HStack>
                    <FontAwesomeIcon icon={faCircle} color="#ffffff" size={10} style={styleSheet.bulletPadding} />
                    <Text color={secondaryTextcolor} fontSize="lg" marginRight={16}>
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
