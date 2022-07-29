export interface LinkingEvent {
    url: string
}

export type LinkingEventHandler = (event: LinkingEvent) => void