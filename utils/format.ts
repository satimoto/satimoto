export const formatSatoshis = (value: number): string => {
    return value.toLocaleString("en-GB").replace(/,/g, " ")
}
