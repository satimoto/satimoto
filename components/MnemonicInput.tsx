import Input from "components/Input"
import { IInputProps, FormControl, useColorModeValue } from "native-base"
import React from "react"
import I18n from "utils/i18n"

interface MnemonicInputProps extends IInputProps {
    wordNo: number
}

const MnemonicInput = ({ wordNo, size = "lg", width, ...props }: MnemonicInputProps) => {
    const textColor = useColorModeValue("lightText", "darkText")

    return (
        <FormControl width={width}>
            <FormControl.Label  _text={{ color: textColor }}>{I18n.t("MnemonicInput_PlaceholderText", { no: wordNo })}</FormControl.Label>
            <Input autoCorrect={false} variant="outline" autoCapitalize="none" size={size} {...props} />
        </FormControl>
    )
}

export default MnemonicInput
