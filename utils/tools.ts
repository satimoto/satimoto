import { INTERVAL_RETRY } from "utils/constants";
import { Log } from "utils/logging"

const log = new Log("Tools")

type ActionType = () => any;

export const timeout = (millis: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, millis));
}

export const doWhile = async (action: ActionType, interval = INTERVAL_RETRY) => {
    while (true) {
        const response = await action()
        
        if (response) {
            return response
        }

        await timeout(interval)
    }
}