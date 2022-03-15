import CameraScanner from "components/CameraScanner"
import React, { useState } from "react"
import { SendNavigationProp } from "screens/AppStack"
import { Log } from "utils/logging"
import { observer } from "mobx-react"
import { useStore } from "hooks/useStore"

const log = new Log("SendCamera")

type SendCameraProps = {
    navigation: SendNavigationProp
}

const SendCamera = ({navigation}: SendCameraProps) => {
    const [isActive, setIsActive] = useState(true)
    const { uiStore } = useStore()

    const onNotAuthorized = () => {
        navigation.goBack()
    }

    const onQrCode = async (qrCode: string) => {
        log.debug(qrCode)
        setIsActive(false)

        qrCode = qrCode.replace(/lightning:/i, "")

        if (qrCode.toLowerCase().startsWith("lnurl")) {
            await uiStore.setLnUrl(qrCode)
            navigation.navigate("Home")
        }

        setIsActive(true)
    }

    return <CameraScanner isActive={isActive} onNotAuthorized={onNotAuthorized} onQrCode={onQrCode}></CameraScanner>
}

export default observer(SendCamera)
