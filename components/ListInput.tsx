import BusyButton from "components/BusyButton"
import Input from "components/Input"
import Modal from "components/Modal"
import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import { FormControl, HStack, Spacer, Text, useColorModeValue, VStack } from "native-base"
import { ResponsiveValue } from "native-base/lib/typescript/components/types"
import { IFontSize, IFontWeight } from "native-base/lib/typescript/theme/base/typography"
import React, { useCallback, useEffect, useState } from "react"
import { KeyboardTypeOptions, StyleProp, View, ViewStyle } from "react-native"
import I18n from "utils/i18n"

interface ListInputProps {
    title: string
    titleSize?: ResponsiveValue<IFontSize | number | (string & {})>
    titleWeight?: ResponsiveValue<IFontWeight | number | (string & {})>
    hint?: string
    hintSize?: ResponsiveValue<IFontSize | number | (string & {})>
    subtext?: string
    style?: StyleProp<ViewStyle>
    keyboardType: KeyboardTypeOptions
    value: string
    valueFormat?: string
    onChangeText: (text: string) => void
}

const ListInput = ({
    title,
    titleSize = "lg",
    titleWeight = "normal",
    hint,
    hintSize = "sm",
    subtext,
    style = {},
    keyboardType = "default",
    value,
    valueFormat = "%s",
    onChangeText
}: ListInputProps) => {
    const primaryTextColor = useColorModeValue("lightText", "darkText")
    const secondaryTextColor = useColorModeValue("warmGray.200", "dark.200")
    const [formattedValue, setFormattedValue] = useState("")
    const [isBusy, setIsBusy] = useState(false)
    const [isModalVisible, setIsModalVisible] = useState(false)
    const [inputValue, setInputValue] = useState("")

    const onInputChangeText = (text: string) => {
        setInputValue(text)
    }

    const onOkPress = async () => {
        setIsBusy(true)

        try {
            await onChangeText(inputValue)
            onModalClose()
        } catch (err) {}

        setIsBusy(false)
    }

    const onModalClose = () => {
        setIsModalVisible(false)
    }

    useEffect(() => {
        setFormattedValue(valueFormat.replace("%s", value))
        setInputValue(value)
    }, [value, valueFormat])

    return (
        <View>
            <TouchableOpacityOptional onPress={() => setIsModalVisible(true)}>
                <HStack justifyContent="space-between" width="100%" style={style}>
                    <VStack flexBasis={0} flexGrow={12}>
                        <Text color={primaryTextColor} fontSize={titleSize} fontWeight={titleWeight}>
                            {title}
                        </Text>
                        {hint && (
                            <Text color={secondaryTextColor} fontSize={hintSize}>
                                {hint}
                            </Text>
                        )}
                    </VStack>
                    <Spacer />
                    <Text color={primaryTextColor} fontSize={titleSize} fontWeight={titleWeight}>
                        {formattedValue}
                    </Text>
                </HStack>
            </TouchableOpacityOptional>
            <Modal isVisible={isModalVisible} onClose={onModalClose}>
                <VStack alignItems="center" space={5} width="100%">
                    <Text color={primaryTextColor} fontSize="xl">
                        {title}
                    </Text>
                    {subtext && (
                        <Text color={primaryTextColor} fontSize="md">
                            {subtext}
                        </Text>
                    )}
                    <FormControl isRequired={true}>
                        <Input value={inputValue} keyboardType={keyboardType} isFullWidth={true} onChangeText={onInputChangeText} />
                    </FormControl>
                    <BusyButton isBusy={isBusy} onPress={onOkPress}>
                        {I18n.t("Button_Ok")}
                    </BusyButton>
                </VStack>
            </Modal>
        </View>
    )
}

export default ListInput
