import { action, makeObservable, observable, reaction, runInAction } from "mobx"
import { makePersistable } from "mobx-persist-store"
import ConnectorModel, { ConnectorGroup, ConnectorGroupMap, ConnectorModelLike } from "models/Connector"
import EvseModel from "models/Evse"
import LocationModel, { LocationModelLike } from "models/Location"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getConnector, getLocation, listLocations } from "services/SatimotoService"
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

    selectedLocation: LocationModelLike
    selectedConnectors: ConnectorGroup[]

    searchConnector(identifier: string): Promise<ConnectorModelLike>
    setSelectedLocation(uid: string): void
    refreshSelectedLocation(): void
    removeSelectedLocation(): void
    setBounds(bounds: GeoJSON.Position[]): void
    startLocationUpdates(): void
    stopLocationUpdates(): void
}

export class LocationStore implements LocationStoreInterface {
    hydrated = false
    ready = false
    stores

    bounds
    locations

    selectedLocation: LocationModelLike = undefined
    selectedConnectors

    lastLocationChanged: boolean = true
    locationUpdateTimer: any = undefined

    constructor(stores: Store) {
        this.stores = stores
        this.bounds = observable<GeoJSON.Position>([])
        this.locations = observable<LocationModel>([])
        this.selectedConnectors = observable<ConnectorGroup>([])

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            bounds: observable,
            locations: observable,

            selectedLocation: observable,
            selectedConnectors: observable,

            setBounds: action,
            updateLocations: action,

            setSelectedLocation: action,
            removeSelectedLocation: action,
            updateActiveConnectors: action
        })

        makePersistable(
            this,
            {
                name: "LocationStore",
                properties: ["selectedLocation", "selectedConnectors"],
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
                () => this.selectedLocation,
                () => this.updateActiveConnectors()
            )
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    async fetchLocations() {
        if (this.stores.settingStore.accessToken) {
            if (this.bounds && this.bounds.length == 2) {
                const locations = await listLocations({
                    xMin: this.bounds[1][0],
                    yMin: this.bounds[0][1],
                    xMax: this.bounds[0][0],
                    yMax: this.bounds[1][1],
                    interval: this.lastLocationChanged ? 0 : LOCATION_UPDATE_INTERVAL
                })

                this.updateLocations(locations.data.listLocations)
            }
        }
    }

    async refreshSelectedLocation() {
        if (this.selectedLocation) {
            return await this.setSelectedLocation(this.selectedLocation.uid)
        }

        throw Error("No location set")
    }

    removeSelectedLocation(): void {
        this.selectedLocation = undefined
    }

    async setSelectedLocation(uid: string) {
        const location = await getLocation({ uid })

        runInAction(() => {
            this.selectedLocation = location.data.getLocation as LocationModel
        })
    }

    async searchConnector(identifier: string): Promise<ConnectorModelLike> {
        const connectorResponse = await getConnector({ identifier })
        const connector = connectorResponse.data.getConnector as ConnectorModel

        if (connector.evse && connector.evse.location) {
            return connector
        }

        return undefined
    }

    async setBounds(bounds: GeoJSON.Position[]) {
        this.bounds.replace(bounds)
        this.lastLocationChanged = true

        this.fetchLocations()
    }

    setReady() {
        this.ready = true
    }

    startLocationUpdates() {
        log.debug(`startLocationUpdates`)

        if (!this.locationUpdateTimer) {
            this.fetchLocations()
            this.locationUpdateTimer = setInterval(this.fetchLocations.bind(this), LOCATION_UPDATE_INTERVAL * 1000)
        }
    }

    stopLocationUpdates() {
        log.debug(`stopLocationUpdates`)
        clearInterval(this.locationUpdateTimer)
        this.locationUpdateTimer = null
    }

    updateActiveConnectors() {
        if (this.selectedLocation) {
            const evses: EvseModel[] = this.selectedLocation.evses || []
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

            this.selectedConnectors.replace(Object.values(connectors))
        } else {
            this.selectedConnectors.clear()
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
