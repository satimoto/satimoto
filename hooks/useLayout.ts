import { useCallback, useState } from "react"
import { LayoutChangeEvent, LayoutRectangle } from "react-native"

const useLayout = (): [LayoutRectangle, (event: LayoutChangeEvent) => void] => {
    const [rectangle, setRectangle] = useState<LayoutRectangle>({x: 0, y: 0, width: 0, height: 0})

    const onLayout = useCallback((event: LayoutChangeEvent) => {
        setRectangle(event.nativeEvent.layout)
    }, [])

    return [rectangle, onLayout]
}

export default useLayout
