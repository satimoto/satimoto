import PlatformSafeAreaView from "components/PlatformSafeAreaView"
import RoundedButton from "components/RoundedButton"
import { useStore } from "hooks/useStore"
import I18n from "i18n-js"
import { observer } from "mobx-react"
import { HStack, Text, useColorModeValue } from "native-base"
import React, { useState } from "react"
import { Dimensions, ImageBackground, StyleSheet, View } from "react-native"
import Swiper from "react-native-swiper"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "screens/AppStack"
import { Log } from "utils/logging"
import styles from "utils/styles"
import { ONBOARDING_VERSION } from "utils/constants"
import { LightningBackend } from "types/lightningBackend"

const log = new Log("Welcome")
const logo = require("assets/Logo.png")

const styleSheet = StyleSheet.create({
    slide: {
        flex: 1,
        padding: 25,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden"
    },
    image: {
        position: "absolute"
    },
    buttonContainer: {
        position: "absolute",
        bottom: 100
    },
    text: {
        color: "#fff",
        fontSize: 36,
        fontWeight: "bold"
    },
    subtext: {
        color: "#eee",
        fontSize: 18,
        padding: 10
    }
})

const backgroundColors = ["#1b88f6", "#6852dc", "#ba1dc1"]
const dotColors = ["#3294f7", "#7763df", "#d221da"]

type WelcomeProps = {
    navigation: NativeStackNavigationProp<AppStackParamList, "Welcome">
}

const Welcome = ({ navigation }: WelcomeProps) => {
    const textColor = useColorModeValue("lightText", "darkText")
    const [backgroundColor, setBackgroundColor] = useState(backgroundColors[0])
    const [dotColor, setDotColor] = useState(dotColors[0])
    const { uiStore } = useStore()

    const height = Dimensions.get("window").height
    const width = Dimensions.get("window").width
    const logoWidth = height * 1.032
    const halfHeight = height / 2
    const halfWidth = width / 2

    const onIndexChanged = (index: number) => {
        setBackgroundColor(backgroundColors[index])
        setDotColor(dotColors[index])
    }

    const onImportPress = () => {
        navigation.navigate("SettingsImportMnemonic", { backend: LightningBackend.BREEZ_SDK })
    }

    const onStartPress = () => {
        uiStore.setOnboarding(true, ONBOARDING_VERSION)
        navigation.navigate("Home")
    }

    return (
        <PlatformSafeAreaView style={[styles.matchParent, { backgroundColor, justifyContent: "center", alignItems: "center" }]}>
            <Swiper loop={false} onIndexChanged={onIndexChanged} activeDotColor={dotColor} showsPagination={true}>
                <View style={[styleSheet.slide, { backgroundColor: backgroundColors[0] }]}>
                    <ImageBackground
                        resizeMode="contain"
                        source={logo}
                        style={[styleSheet.image, { width: logoWidth, height, top: 45, left: halfWidth - 280 }]}
                    />
                    <Text color={textColor} fontSize={64} fontWeight="bold" textAlign="center">
                        {I18n.t("Welcome_OnboardingSlide1Title")}
                    </Text>
                    <Text style={styleSheet.subtext} textAlign="center">
                        {I18n.t("Welcome_OnboardingSlide1Subtitle")}
                    </Text>
                </View>
                <View style={[styleSheet.slide, { backgroundColor: backgroundColors[1] }]}>
                    <ImageBackground
                        resizeMode="contain"
                        source={logo}
                        style={[styleSheet.image, { width: 1548, height: 1500, top: halfHeight - 500, left: halfWidth - 440 }]}
                    />
                    <Text color={textColor} fontSize={48} fontWeight="bold" textAlign="center" style={{ marginTop: 200 }}>
                        {I18n.t("Welcome_OnboardingSlide2Title")}
                    </Text>
                    <Text style={styleSheet.subtext} textAlign="center">
                        {I18n.t("Welcome_OnboardingSlide2Subtitle")}
                    </Text>
                </View>
                <View style={[styleSheet.slide, { backgroundColor: backgroundColors[2] }]}>
                    <ImageBackground
                        resizeMode="contain"
                        source={logo}
                        style={[styleSheet.image, { width: 1548, height: 1500, top: halfHeight - 850, left: halfWidth - 545 }]}
                    />
                    <Text color={textColor} fontSize={48} fontWeight="bold" textAlign="center" style={{ marginTop: -200 }}>
                        {I18n.t("Welcome_OnboardingSlide3Title")}
                    </Text>
                    <Text style={styleSheet.subtext} textAlign="center">
                        {I18n.t("Welcome_OnboardingSlide3Subtitle")}
                    </Text>
                    <HStack style={styleSheet.buttonContainer} space={2}>
                        <RoundedButton variant="outline" colorScheme="cyan" onPress={onImportPress}>
                            {I18n.t("Welcome_ImportButton")}
                        </RoundedButton>
                        <RoundedButton onPress={onStartPress}>{I18n.t("Welcome_StartButton")}</RoundedButton>
                    </HStack>
                </View>
            </Swiper>
        </PlatformSafeAreaView>
    )
}

export default observer(Welcome)
