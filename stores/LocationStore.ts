import { action, makeObservable, observable, reaction, runInAction } from "mobx"
import { makePersistable } from "mobx-persist-store"
import ConnectorModel, { ConnectorGroup, ConnectorGroupMap } from "models/Connector"
import EvseModel from "models/Evse"
import LocationModel, { LocationModelLike } from "models/Location"
import moment from "moment"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getLocation, listLocations } from "services/SatimotoService"
import { StoreInterface, Store } from "stores/Store"
import { EvseStatus, EvseStatusSortMap } from "types/evse"
import { DEBUG } from "utils/build"
import { LOCATION_UPDATE_INTERVAL } from "utils/constants"
import { Log } from "utils/logging"

const log = new Log("LocationStore")

export interface LocationStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    bounds: GeoJSON.Position[]
    locations: LocationModel[]

    activeLocation: LocationModelLike
    activeConnectors: ConnectorGroup[]

    setActiveLocation(uid: string): void
    refreshActiveLocation(): void
    removeActiveLocation(): void
    setBounds(bounds: GeoJSON.Position[]): void
    monitorLocationUpdates(enable: boolean): void
}

export class LocationStore implements LocationStoreInterface {
    hydrated = false
    ready = false
    stores

    bounds
    locations

    activeLocation: LocationModelLike = undefined
    activeConnectors

    locationUpdatesEnabled = false
    lastLocationChanged: boolean = true
    locationUpdateTimer: any = undefined

    constructor(stores: Store) {
        this.stores = stores
        this.bounds = observable<GeoJSON.Position>([])
        this.locations = observable<LocationModel>([])
        this.activeConnectors = observable<ConnectorGroup>([])

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            bounds: observable,
            locations: observable,

            activeLocation: observable,
            activeConnectors: observable,

            setBounds: action,
            updateLocations: action,

            setActiveLocation: action,
            removeActiveLocation: action,
            updateActiveConnectors: action
        })

        makePersistable(
            this,
            {
                name: "LocationStore",
                properties: [],
                storage: AsyncStorage,
                debugMode: DEBUG
            },
            { delay: 1000 }
        ).then(action((persistStore) => (this.hydrated = persistStore.isHydrated)))
    }

    async initialize(): Promise<void> {
        try {
            // When location is changed, update connectors
            reaction(
                () => this.activeLocation,
                () => this.updateActiveConnectors()
            )
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    monitorLocationUpdates(enable: boolean) {
        log.debug(`monitorLocationUpdates ${enable}`)

        if (enable && !this.locationUpdateTimer) {
            this.locationUpdateTimer = setInterval(this.requestLocations.bind(this), LOCATION_UPDATE_INTERVAL * 1000)
        } else {
            clearInterval(this.locationUpdateTimer)
        }
    }

    async refreshActiveLocation() {
        if (this.activeLocation) {
            return await this.setActiveLocation(this.activeLocation.uid)
        }

        throw Error("No location set")
    }

    removeActiveLocation(): void {
        this.activeLocation = undefined
    }

    async requestLocations() {
        if (this.stores.settingStore.accessToken) {
            if (this.bounds && this.bounds.length == 2) {
                const locations = await listLocations({
                    xMin: this.bounds[1][0],
                    yMin: this.bounds[0][1],
                    xMax: this.bounds[0][0],
                    yMax: this.bounds[1][1],
                    interval: LOCATION_UPDATE_INTERVAL
                })

                this.updateLocations(locations.data.listLocations)
            }
        }
    }

    async setActiveLocation(uid: string) {
        const location = await getLocation({ uid })

        runInAction(() => {
            this.activeLocation = location.data.getLocation as LocationModel
        })
    }

    async setBounds(bounds: GeoJSON.Position[]) {
        this.bounds.replace(bounds)
        this.lastLocationChanged = true

        this.requestLocations()
    }

    setReady() {
        this.ready = true
    }
    
    updateActiveConnectors() {
        if (this.activeLocation) {
            const evses: EvseModel[] = this.activeLocation.evses || []
            const connectors = evses.reduce((connectorGroupMap: ConnectorGroupMap, evse: EvseModel) => {
                return evse.connectors.reduce((connectorGroupMap: ConnectorGroupMap, connector: ConnectorModel) => {
                    const groupKey = `${connector.standard}:${connector.wattage}`
                    connectorGroupMap[groupKey] = connectorGroupMap[groupKey] || {
                        ...connector,
                        availableConnectors: 0,
                        totalConnectors: 0,
                        evses: []
                    }

                    if (evse.status === EvseStatus.AVAILABLE) {
                        connectorGroupMap[groupKey].availableConnectors++
                    }

                    connectorGroupMap[groupKey].evses.push(evse)
                    connectorGroupMap[groupKey].evses.sort((a: EvseModel, b: EvseModel) => {
                        return EvseStatusSortMap[a.status] - EvseStatusSortMap[b.status]
                    })

                    connectorGroupMap[groupKey].totalConnectors++

                    return connectorGroupMap
                }, connectorGroupMap)
            }, {})

            this.activeConnectors.replace(Object.values(connectors))
        } else {
            this.activeConnectors.clear()
        }
    }

    updateLocations(locations: LocationModel[]) {
        log.debug(`updateLocations ${this.locations.length} ${locations.length}`)

        if (this.lastLocationChanged) {
            this.locations.replace(locations)
        } else {
            // Update/add to existing locations
            locations.forEach((location) => {
                let existingLocation = this.locations.find((l) => l.uid === location.uid)

                if (existingLocation) {
                    Object.assign(existingLocation, location)
                } else {
                    this.locations.push(location)
                }
            })
        }

        this.lastLocationChanged = false
    }
}
