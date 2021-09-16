export const toBuffer = (str?: any) => {
    return str ? Buffer.from(String(str), "utf8") : str
}
