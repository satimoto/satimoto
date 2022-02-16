import React from "react"

interface Location {
    id: number
    uuid: string
    busyConnections: number
    totalConnections: number
    coordinate: number[]
}

export default Location