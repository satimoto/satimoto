import BusyButton from "components/BusyButton"
import LocationHeader from "components/LocationHeader"
import useColor from "hooks/useColor"
import { observer } from "mobx-react"
import { Text, useColorModeValue, useTheme, VStack } from "native-base"
import React, { useLayoutEffect, useState } from "react"
import { View } from "react-native"
import { RouteProp } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { startSession } from "services/SatimotoService"
import { AppStackParamList } from "screens/AppStack"
import I18n from "utils/i18n"
import styles from "utils/styles"
import { errorToString } from "utils/conversion"

type ConnectorDetailProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "ConnectorDetail">
    route: RouteProp<AppStackParamList, "ConnectorDetail">
}

const ConnectorDetail = ({ navigation, route }: ConnectorDetailProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const errorColor = useColorModeValue("error.300", "error.500")
    const textColor = useColorModeValue("lightText", "darkText")
    const [isBusy, setIsBusy] = useState(false)
    const [lastError, setLastError] = useState("")
    const [location, setLocation] = useState(route.params.location)
    const [evse, setEvse] = useState(route.params.evse)

    const onStartPress = async () => {
        setIsBusy(true)

        try {
            const result = await startSession({locationUid: location.uid, evseUid: evse.uid})
        } catch (error) {
            setLastError(errorToString(error))
        }

        setIsBusy(false)
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            title: I18n.t("ConnectorDetail_HeaderTitle")
        })
    }, [navigation])


    return (
        <View style={[styles.matchParent, { padding: 10, backgroundColor }]}>
            <LocationHeader location={route.params.location} />
            <VStack space={2}>
                {lastError.length > 0 && <Text color={errorColor}>{lastError}</Text>}
                <BusyButton isBusy={isBusy} marginTop={5} onPress={onStartPress}>
                    {I18n.t("Button_Start")}
                </BusyButton>
            </VStack>
        </View>
    )
}

export default observer(ConnectorDetail)
