import { HStack, Spacer, Switch, Text, useColorModeValue, VStack } from "native-base"
import { ResponsiveValue } from "native-base/lib/typescript/components/types"
import { IFontSize, IFontWeight } from "native-base/lib/typescript/theme/base/typography"
import React from "react"
import { StyleProp, ViewStyle } from "react-native"

interface ListSwitchProps {
    title: string
    titleSize?: ResponsiveValue<IFontSize | number | (string & {})>
    titleWeight?: ResponsiveValue<IFontWeight | number | (string & {})>
    hint?: string
    hintSize?: ResponsiveValue<IFontSize | number | (string & {})>
    style?: StyleProp<ViewStyle>
    isChecked: boolean
    onToggle: () => void
}

const ListSwitch = ({ title, titleSize = "lg", titleWeight = "normal", hint, hintSize = "sm", style = {}, isChecked, onToggle }: ListSwitchProps) => {
    const primaryTextcolor = useColorModeValue("lightText", "darkText")
    const secondaryTextcolor = useColorModeValue("warmGray.200", "dark.200")

    return (
        <HStack justifyContent="space-between" width="100%" style={style}>
            <VStack flexBasis={0} flexGrow={12}>
                <Text color={primaryTextcolor} fontSize={titleSize} fontWeight={titleWeight}>
                    {title}
                </Text>
                {hint && (
                    <Text color={secondaryTextcolor} fontSize={hintSize}>
                        {hint}
                    </Text>
                )}
            </VStack>
            <Spacer />
            <Switch isChecked={isChecked} onToggle={onToggle} size="md" />
        </HStack>
    )
}

export default ListSwitch
