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
        case SessionStatus.COMPLETED:
            return ChargeSessionStatus.STOPPING
        case SessionStatus.PENDING:
            return ChargeSessionStatus.STARTING
    }

    return ChargeSessionStatus.IDLE
}

export { toChargeSessionStatus }
