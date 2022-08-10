class Canceled extends Error {
    constructor(reason: string = "") {
        super(reason);
        Object.setPrototypeOf(this, Canceled.prototype);
    }
}

export interface Cancelable<T> extends Promise<T> {
    cancel(reason?: string): Cancelable<T>;
}

const cancelable = <T>(promise: Promise<T>, onCancel?: (canceled: Canceled) => void): Cancelable<T> => {
    let cancel: ((reason: string) => Cancelable<T>) | null = null;
    let cancelable: Cancelable<T>;
    cancelable = <Cancelable<T>>new Promise((resolve, reject) => {
        cancel = (reason: string = "") => {
            try {
                if (onCancel) {
                    onCancel(new Canceled(reason));
                }
            } catch (e) {
                reject(e);
            }
            return cancelable;
        };
        promise.then(resolve, reject);
    });
    if (cancel) {
        cancelable.cancel = cancel;
    }
    return cancelable;
}

export default cancelable