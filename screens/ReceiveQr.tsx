import HeaderBackButton from "components/HeaderBackButton"
import QrCode from "components/QrCode"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { useTheme } from "native-base"
import React, { useLayoutEffect } from "react"
import { Dimensions, Share, View } from "react-native"
import { ReceiveNavigationProp } from "screens/AppStack"
import { ReceiveQrRouteProp } from "screens/ReceiveStack"
import styles from "utils/styles"

type ReceiveQrProps = {
    navigation: ReceiveNavigationProp
    route: ReceiveQrRouteProp
}

const ReceiveQr = ({ navigation, route }: ReceiveQrProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const navigationOptions = useNavigationOptions({ headerShown: true })
    const size = Dimensions.get("window").width - 20

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <HeaderBackButton
                    tintColor={navigationOptions.headerTintColor}
                    onPress={() => {
                        navigation.navigate("Home")
                    }}
                />
            ),
            title: "Invoice"
        })
    }, [navigation])

    const onPress = async () => {
        await Share.share({ message: `lightning:${route.params.qrCode}` })
    }

    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            <QrCode value={route.params.qrCode} onPress={onPress} size={size} />
        </View>
    )
}

export default ReceiveQr
