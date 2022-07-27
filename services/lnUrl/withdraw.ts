import { LNURLResponse } from "js-lnurl"
import Url from "url-parse"

export const withdrawRequest = async (callback: string, k1: string, paymentRequest: string): Promise<LNURLResponse> => {
    let url = new Url(callback, true)
    url.set("query", { ...url.query, k1, pr: paymentRequest })

    try {
        const fetchResult = await fetch(url.toString())
        const withdrawResult = await fetchResult.json()

        return withdrawResult as LNURLResponse
    } catch {}

    throw new Error(`Invalid response from ${url.hostname}`)
}
