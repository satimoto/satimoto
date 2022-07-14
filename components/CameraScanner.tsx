import React, { PropsWithChildren } from "react"
import { StyleSheet, View } from "react-native"
import { RNCamera, BarCodeReadEvent } from "react-native-camera"
import { useTheme } from "native-base"
import useColor from "hooks/useColor"
import CameraViewFinder from "components/CameraViewFinder"
import I18n from "utils/i18n"
import { Log } from "utils/logging"

const log = new Log("CameraScanner")

interface CameraScannerProps extends PropsWithChildren<any> {
    isActive: boolean
    onNotAuthorized: () => void
    onQrCode: (qrCode: string) => void
}

const CameraScanner = ({ children, isActive, onNotAuthorized, onQrCode }: CameraScannerProps) => {
    const { colors } = useTheme()
    const backgroundColor = useColor(colors.dark[200], colors.warmGray[50])

    const androidCameraPermissionOptions = {
        title: I18n.t("CameraScanner_PermissionTitle"),
        message: I18n.t("CameraScanner_PermissionMessage")
    }

    const onBarCodeRead = ({ data }: BarCodeReadEvent) => {
        if (isActive) {
            onQrCode(data)
        }
    }

    const onStatusChange = (event: any) => {
        if (event.cameraStatus === "NOT_AUTHORIZED") {
            onNotAuthorized()
        }
    }

    return (
        <RNCamera
            style={StyleSheet.absoluteFill}
            androidCameraPermissionOptions={androidCameraPermissionOptions}
            barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
            captureAudio={false}
            pendingAuthorizationView={<View style={[StyleSheet.absoluteFill, { backgroundColor }]}></View>}
            onBarCodeRead={onBarCodeRead}
            onStatusChange={onStatusChange}
        >
            <CameraViewFinder width="65%" height="65%" />
            {children}
        </RNCamera>
    )
}

export default CameraScanner
