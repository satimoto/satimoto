import React from "react"

interface Location {
    uuid: string
    name: string
    address: string
    city: string
    postalCode: string
}

type LocationLike = Location | undefined

export default Location
export type { LocationLike }
