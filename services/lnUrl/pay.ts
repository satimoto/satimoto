import { LNURLPayResult } from "js-lnurl"
import Url from "url-parse"

export const getPayRequest = async (callback: string, amountMsat: string): Promise<LNURLPayResult> => {
    let url = new Url(callback, true)
    url.set("query", { ...url.query, amount: amountMsat })

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
