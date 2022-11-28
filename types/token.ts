import { AuthMethod } from "./authMethod"

export enum TokenType {
    OTHER = "OTHER",
    RFID = "RFID"
}

const toTokenType = (authMethod: AuthMethod): TokenType => {
    if (authMethod === AuthMethod.AUTH_REQUEST) {
        return TokenType.OTHER
    }

    return TokenType.RFID
}

export { toTokenType }
