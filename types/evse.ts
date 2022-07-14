export enum EvseStatus {
    AVAILABLE = "AVAILABLE",
    BLOCKED = "BLOCKED",
    CHARGING = "CHARGING",
    INOPERATIVE = "INOPERATIVE",
    OUTOFORDER = "OUTOFORDER",
    PLANNED = "PLANNED",
    REMOVED = "REMOVED",
    RESERVE = "RESERVE",
    UNKNOWN = "UNKNOWN"
}

interface EvseStatusSortMapInterface {
    [type: string]: number
}

const EvseStatusSortMap: EvseStatusSortMapInterface = {
    AVAILABLE: 1,
    BLOCKED: 3,
    CHARGING: 2,
    INOPERATIVE: 4,
    OUTOFORDER: 4,
    PLANNED: 4,
    REMOVED: 5,
    RESERVE: 2,
    UNKNOWN: 5
}

export { EvseStatusSortMap }
