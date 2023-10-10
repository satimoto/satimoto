import { SessionStatus } from "./session"

export enum ChargeSessionStatus {
    IDLE = "IDLE",
    STARTING = "STARTING",
    ACTIVE = "ACTIVE",
    STOPPING = "STOPPING"
}

const toChargeSessionStatus = (state: SessionStatus): ChargeSessionStatus => {
    switch (state) {
        case SessionStatus.ACTIVE:
            return ChargeSessionStatus.ACTIVE
        case SessionStatus.PENDING:
            return ChargeSessionStatus.STARTING
        case SessionStatus.ENDING:
            return ChargeSessionStatus.STOPPING
    }

    return ChargeSessionStatus.IDLE
}

export { toChargeSessionStatus }
