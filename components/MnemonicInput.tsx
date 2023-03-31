import Input from "components/Input"
import { IInputProps } from "native-base"
import React from "react"
import I18n from "utils/i18n"

interface MnemonicInputProps extends IInputProps {
    wordNo: number
}

const MnemonicInput = ({ wordNo, ...props }: MnemonicInputProps) => {
    return (
        <Input
            autoCorrect={false}
            autoCapitalize="none"
            placeholder={I18n.t("MnemonicInput_PlaceholderText", {no: wordNo})}
            {...props}
        />
    )
}

export default MnemonicInput
