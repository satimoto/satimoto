import React, { useEffect, useState } from "react"
import TagModel from "models/Tag"
import PillTray from "components/PillTray"
import PillBadge from "components/PillBadge"

const TAG_TEXT_BLACK: string[] = []
const TAG_COLOR_SCHEMES: { [key: string]: string } = {
    amenity: "blue",
    shop: "orange",
    tourism: "pink",
    office: "indigo",
    place: "teal",
    barrier: "red",
    highway: "blue",
    historic: "yellow",
    leisure: "cyan",
    man_made: "red",
    natural: "green",
    religion: "yellow",
    sport: "teal",
    station: "blue",
    cuisine: "cyan",
    building: "teal"
}

interface PillTrayProps {
    tags: TagModel[]
    marginTop?: number
}

type Pill = {
    key: string
    label: string
    colorScheme: string
    textColor: string
}

const TagsPillTray = ({ tags, marginTop = 0 }: PillTrayProps) => {
    const [pills, setPills] = useState<Pill[]>([])

    useEffect(() => {
        setPills(
            tags.reduce<Pill[]>((arr: Pill[], tag: TagModel) => {
                const textColor = TAG_TEXT_BLACK.includes(tag.key) ? "#000" : "#fff"
                const colorScheme = TAG_COLOR_SCHEMES[tag.key] || "orange"
                const values = tag.value.replace("_", " ")

                values.split(";").map((label) => {
                    arr.push({key: tag.key+label, label, colorScheme, textColor})
                })
                return arr
            }, [])
        )
    }, [tags])

    return (
        <PillTray marginTop={marginTop} justifyContent="flex-start" space={1}>
            {pills.map((pill) => (
                <PillBadge key={pill.key} colorScheme={pill.colorScheme} label={pill.label} marginTop={1} textColor={pill.textColor} variant="outline" />
            ))}
        </PillTray>
    )
}

export default TagsPillTray
