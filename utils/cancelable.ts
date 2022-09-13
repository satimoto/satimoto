class Canceled extends Error {
    constructor(message: string) {
        super(message)
        Object.setPrototypeOf(this, Canceled.prototype)
    }
}

export interface Cancelable<T> extends Promise<T> {
    cancel(message?: string): Cancelable<T>
}

const cancelable = <T>(promise: Promise<T>, onCancel?: (canceled: Canceled) => void): Cancelable<T> => {
    let cancel: ((message: string) => Cancelable<T>) | null = null
    let cancelable: Cancelable<T>
    cancelable = <Cancelable<T>>new Promise((resolve, reject) => {
        cancel = (message: string) => {
            try {
                if (onCancel) {
                    onCancel(new Canceled(message))
                }
            } catch (e) {
                reject(e)
            }
            return cancelable
        }
        promise.then(resolve, reject)
    })
    if (cancel) {
        cancelable.cancel = cancel
    }
    return cancelable
}

export default cancelable
