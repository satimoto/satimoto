import HeaderBackButton from "components/HeaderBackButton"
import QrCode from "components/QrCode"
import useColor from "hooks/useColor"
import useNavigationOptions from "hooks/useNavigationOptions"
import { useTheme } from "native-base"
import React, { useLayoutEffect } from "react"
import { Dimensions, Share, View } from "react-native"
import { RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import I18n from "utils/i18n"
import styles from "utils/styles"

type ReceiveQrProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "ReceiveQr">
    route: RouteProp<AppStackParamList, "ReceiveQr">
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
            title: I18n.t("ReceiveQr_HeaderTitle")
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
