import CameraScanner from "components/CameraScanner"
import React, { useState } from "react"
import { useTheme } from "native-base"
import useColor from "hooks/useColor"
import { SendNavigationProp } from "screens/AppStack"
import { Log } from "utils/logging"

const log = new Log("SendCamera")

type SendCameraProps = {
    navigation: SendNavigationProp
}

const SendCamera = ({navigation}: SendCameraProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])
    const [isActive, setIsActive] = useState(true)

    const onNotAuthorized = () => {
        navigation.goBack()
    }

    const onQrCode = (qrCode: string) => {
        log.debug(qrCode)
        navigation.goBack()
    }

    return <CameraScanner isActive={isActive} onNotAuthorized={onNotAuthorized} onQrCode={onQrCode}></CameraScanner>
}

export default SendCamera
