import React from "react"
import { StyleSheet, View } from "react-native"
import { SvgXml } from "react-native-svg"
import styles from "utils/styles"

const xml = `
<svg width="500" height="500" viewBox="0 0 500 500" fill="none">
	<rect x="10" y="10" width="480" height="480" rx="65" stroke="url(#gradient)" stroke-width="20" />
	<defs>
		<radialGradient id="gradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(-70.1493 665.384) rotate(-53.0871) scale(1010.18 4697.63)">
			<stop offset="0.00856182" stop-color="#0099FF" />
			<stop offset="1" stop-color="#CC11BB" />
		</radialGradient>
	</defs>
</svg>
`

interface CameraViewFinderProps {
    width: string
    height: string
}

const CameraViewFinder = ({ width, height }: CameraViewFinderProps) => {
    return (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
            <SvgXml xml={xml} width={width} height={height} />
        </View>
    )
}

export default CameraViewFinder
