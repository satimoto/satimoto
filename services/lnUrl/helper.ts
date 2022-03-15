import { LNURLAuthParams, LNURLChannelParams, LNURLPayParams, LNURLResponse, LNURLWithdrawParams } from "js-lnurl"

interface LNURLTag {
    tag: string
}

const getTag = (params: LNURLResponse | LNURLChannelParams | LNURLWithdrawParams | LNURLAuthParams | LNURLPayParams): string | null => {
    const lnUrlTag = params as LNURLTag

    if (lnUrlTag) {
        return lnUrlTag.tag
    }

    return null
}

export { getTag }
