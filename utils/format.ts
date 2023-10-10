
const RE = /\w/g;

export const formatSatoshis = (value: number): string => {
    return value.toLocaleString("en-GB").replace(/,/g, " ")
}

export const obfuscateString = (text: string): string => {
    return text.replace(RE, "*")
}
