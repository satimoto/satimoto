import { LNURLPayResult } from "js-lnurl"
import Url from "url-parse"

export const payRequest = async (callback: string, amountMsat: string, comment?: string): Promise<LNURLPayResult> => {
    let url = new Url(callback, true)
    let query: any = { ...url.query, amount: amountMsat }

    if (comment) {
        query["comment"] = comment
    }

    url.set("query", query)

    try {
        const fetchResult = await fetch(url.toString())
        const payResult = await fetchResult.json()

        if (payResult.pr) {
            return payResult as LNURLPayResult
        }

        throw new Error(payResult.reason)
    } catch {}

    throw new Error(`Invalid response from ${url.hostname}`)
}
