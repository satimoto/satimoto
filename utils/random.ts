import Long from "long"

export const randomLong = (): Long => {
    let randomString = ""

    for (let i = 0; i < 18; i++) {
        randomString += Math.floor(Math.random() * 10)
    }
    const l =  Long.fromString(randomString)

    console.log("randomLong: " + randomString + " " + l)
    return l
}
