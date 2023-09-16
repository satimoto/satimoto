import AddressHeader from "components/AddressHeader"
import BtcMapIcon from "components/BtcMapIcon"
import PaymentOnchainIcon from "components/PaymentOnchainIcon"
import PaymentLightningIcon from "components/PaymentLightningIcon"
import PaymentLightningNfcIcon from "components/PaymentLightningNfcIcon"
import RoundedButton from "components/RoundedButton"
import TagsPillTray from "components/TagsPillTray"
import TouchableOpacityOptional from "components/TouchableOpacityOptional"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faClock } from "@fortawesome/free-regular-svg-icons"
import { faPhone, faGlobe, faBolt } from "@fortawesome/free-solid-svg-icons"
import useColor from "hooks/useColor"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"
import { HStack, Spacer, Text, useColorModeValue, useTheme, VStack } from "native-base"
import React, { useCallback, useEffect, useState } from "react"
import { Animated, Dimensions, Linking, StyleSheet, View } from "react-native"
import SlidingUpPanel from "rn-sliding-up-panel"
import I18n from "utils/i18n"
import { Log } from "utils/logging"

const log = new Log("SlidingPoiPanel")

const styles = StyleSheet.create({
    slidingUpPanel: {
        flex: 1,
        backgroundColor: "white",
        borderRadius: 30,
        padding: 10
    }
})

interface SlidingPoiPanelProps {
    onHide?: () => void
    onBottomReached?: () => void
}

const SlidingPoiPanel = React.forwardRef(({ onHide, onBottomReached }: SlidingPoiPanelProps, ref?: React.LegacyRef<SlidingUpPanel>) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const textColor = useColorModeValue("lightText", "darkText")
    const [animatedValue] = useState(new Animated.Value(0))
    const [allowDragging, setAllowDragging] = useState(true)
    const [phone, setPhone] = useState<string>()
    const [website, setWebsite] = useState<string>()
    const [paymentUri, setPaymentUri] = useState<string>()
    const { locationStore, uiStore } = useStore()

    const draggableRange = {
        top: (Dimensions.get("window").height / 4) * 3,
        bottom: 0
    }

    const snappingPoints = [draggableRange.top / 2]

    if (!ref) {
        ref = React.createRef()
    }

    useEffect(() => {
        setPaymentUri(locationStore.selectedPoi?.paymentUri)
        setPhone(locationStore.selectedPoi?.phone)
        setWebsite(locationStore.selectedPoi?.website)
    }, [locationStore.selectedPoi])

    const onPaymentPress = useCallback(() => {
        if (paymentUri) {
            if (paymentUri.includes("http")) {
                Linking.openURL(paymentUri)
            } else {
                uiStore.parseIntent(paymentUri)
            }
        }
    }, [paymentUri])

    const onPhonePress = useCallback(() => {
        if (phone) {
            Linking.openURL(`tel:${phone}`)
        }
    }, [phone])

    const onSourcePress = useCallback(() => {
        if (locationStore.selectedPoi?.uid) {
            Linking.openURL(`https://btcmap.org/merchant/node:${locationStore.selectedPoi.uid}`)
        } else {
            Linking.openURL(`https://btcmap.org`)
        }
    }, [])

    const onWebsitePress = useCallback(async () => {
        if (website) {
            Linking.openURL(website)
        }
    }, [website])

    const onPressIn = () => setAllowDragging(false)
    const onPressOut = () => setAllowDragging(true)

    return (
        <SlidingUpPanel
            animatedValue={animatedValue}
            draggableRange={draggableRange}
            height={draggableRange.top - draggableRange.bottom}
            snappingPoints={snappingPoints}
            ref={ref}
            onHide={onHide}
            onBottomReached={onBottomReached}
            allowDragging={allowDragging}
            backdropStyle={{ alignItems: "flex-start" }}
        >
            {locationStore.selectedPoi && (
                <View style={[styles.slidingUpPanel, { backgroundColor }]}>
                    <VStack space={2}>
                        <AddressHeader
                            name={locationStore.selectedPoi.name}
                            geom={locationStore.selectedPoi.geom}
                            address={locationStore.selectedPoi.address}
                            city={locationStore.selectedPoi.city}
                            postalCode={locationStore.selectedPoi.postalCode}
                            onPressIn={onPressIn}
                            onPressOut={onPressOut}
                        />
                        {(paymentUri || phone || website) && (
                            <HStack space={1} justifyContent="center">
                                {phone && (
                                    <RoundedButton
                                        size="md"
                                        onPress={onPhonePress}
                                        onPressIn={onPressIn}
                                        onPressOut={onPressOut}
                                        leftIcon={<FontAwesomeIcon icon={faPhone} color="#ffffff" />}
                                    >
                                        {I18n.t("Button_Phone")}
                                    </RoundedButton>
                                )}
                                {website && (
                                    <RoundedButton
                                        size="md"
                                        onPress={onWebsitePress}
                                        onPressIn={onPressIn}
                                        onPressOut={onPressOut}
                                        leftIcon={<FontAwesomeIcon icon={faGlobe} color="#ffffff" />}
                                    >
                                        {I18n.t("Button_Website")}
                                    </RoundedButton>
                                )}
                                {paymentUri && (
                                    <RoundedButton
                                        size="md"
                                        colorScheme="orange"
                                        onPress={onPaymentPress}
                                        onPressIn={onPressIn}
                                        onPressOut={onPressOut}
                                        leftIcon={<FontAwesomeIcon icon={faBolt} color="#ffffff" />}
                                    >
                                        {I18n.t("Button_Pay")}
                                    </RoundedButton>
                                )}
                            </HStack>
                        )}
                        {locationStore.selectedPoi.tags && <TagsPillTray marginTop={3} tags={locationStore.selectedPoi.tags} />}
                        {locationStore.selectedPoi.openingTimes && (
                            <HStack alignItems="center" space={1} marginTop={3} marginRight={5} paddingLeft={1}>
                                <FontAwesomeIcon icon={faClock} color="#ffffff" size={20} />
                                <Text color={textColor} marginLeft={1}>
                                    {locationStore.selectedPoi.openingTimes}
                                </Text>
                            </HStack>
                        )}
                        <HStack space={1} marginTop={3}>
                            <PaymentOnchainIcon size={30} enabled={locationStore.selectedPoi.paymentOnChain} />
                            <PaymentLightningIcon size={30} enabled={locationStore.selectedPoi.paymentLn} />
                            <PaymentLightningNfcIcon size={30} enabled={locationStore.selectedPoi.paymentLnTap} />
                            <Spacer />
                            <TouchableOpacityOptional onPress={onSourcePress} onPressIn={onPressIn} onPressOut={onPressOut}>
                                <BtcMapIcon width={30} height={30} />
                            </TouchableOpacityOptional>
                        </HStack>
                    </VStack>
                </View>
            )}
        </SlidingUpPanel>
    )
})

const createSlidingPoiPanelRef = () => {
    return React.createRef<SlidingUpPanel>()
}

export default observer(SlidingPoiPanel)
export { createSlidingPoiPanelRef }
