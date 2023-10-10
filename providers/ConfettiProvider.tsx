import React, { createContext, PropsWithChildren, useCallback, useContext, useMemo, useRef } from "react"
import ConfettiCannon from "react-native-confetti-cannon"
import { timeout } from "utils/backoff"

interface ConfettiContextProps {
    startConfetti: (resume?: boolean) => Promise<void>
    stopConfetti: () => void
}

type ConfettiOrigin = {
    x: number
    y: number
}

interface ConfettiProvderProps extends PropsWithChildren<any> {
    count: number
    size?: number
    colors?: string[]
    fallSpeed?: number
    origin: ConfettiOrigin
}

const ConfettiContext = createContext<ConfettiContextProps>({} as ConfettiContextProps)
const useConfetti = () => useContext(ConfettiContext)

const ConfettiProvider = ({ children, count, size, colors, fallSpeed = 3000, origin }: ConfettiProvderProps) => {
    const confettiRef = useRef<ConfettiCannon>(null)

    const startConfetti = useCallback((resume?: boolean): Promise<void> => {
        confettiRef.current && confettiRef.current.start(resume)

        return timeout(fallSpeed)
    }, [])

    const stopConfetti = useCallback(() => {
        confettiRef.current && confettiRef.current.stop()
    }, [])

    const value = useMemo(() => {
        return { startConfetti, stopConfetti }
    }, [startConfetti, stopConfetti])

    return (
        <ConfettiContext.Provider value={value}>
            {children}
            <ConfettiCannon
                count={count}
                size={size}
                colors={colors}
                origin={origin}
                autoStart={false}
                fadeOut={true}
                fallSpeed={fallSpeed}
                ref={confettiRef}
            />
        </ConfettiContext.Provider>
    )
}

export { ConfettiContext, useConfetti }
export default ConfettiProvider
