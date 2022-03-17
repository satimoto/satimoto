import CameraScanner from "components/CameraScanner"
import React, { useEffect, useState } from "react"
import { SendNavigationProp } from "screens/AppStack"
import { Log } from "utils/logging"
import { useStore } from "hooks/useStore"
import { observer } from "mobx-react"

const log = new Log("SendCamera")

type SendCameraProps = {
    navigation: SendNavigationProp
}

const SendCamera = ({ navigation }: SendCameraProps) => {
    const [isActive, setIsActive] = useState(true)
    const { uiStore } = useStore()

    useEffect(() => {
        if (uiStore.lnUrlAuthParams) {
            navigation.navigate("Home")

        }
    }, [uiStore.lnUrlAuthParams])

    const onNotAuthorized = () => {
        navigation.goBack()
    }

    const onQrCode = async (qrCode: string) => {
        setIsActive(false)
        const valid = await uiStore.parseQrCode(qrCode)
        //navigation.navigate("Home")

        if (!valid) {
            log.debug("Not a valid QR code")
            setIsActive(true)
        }
    }

    return <CameraScanner isActive={isActive} onNotAuthorized={onNotAuthorized} onQrCode={onQrCode}></CameraScanner>
}

export default observer(SendCamera)
