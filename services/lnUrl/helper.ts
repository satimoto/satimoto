import { LNURLAuthParams, LNURLChannelParams, LNURLPayParams, LNURLResponse, LNURLWithdrawParams } from "js-lnurl"

interface LNURLTag {
    tag: string
}

type MetadataType = string[][]

const getMetadataElement = (metadata: MetadataType, key: string): string | null => {
    const element = metadata.find((element) => element[0] === key)

    return element ? element[1] : null
}

const getTag = (params: LNURLResponse | LNURLChannelParams | LNURLWithdrawParams | LNURLAuthParams | LNURLPayParams): string | null => {
    const lnUrlTag = params as LNURLTag

    if (lnUrlTag) {
        return lnUrlTag.tag
    }

    return null
}

export { getMetadataElement, getTag }
