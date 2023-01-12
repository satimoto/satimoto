import { action, makeObservable, observable, reaction, runInAction } from "mobx"
import { makePersistable } from "mobx-persist-store"
import ConnectorModel, { ConnectorGroup, ConnectorGroupMap, ConnectorModelLike } from "models/Connector"
import EvseModel, { EvseModelLike } from "models/Evse"
import LocationModel, { LocationModelLike } from "models/Location"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getConnector, getLocation, listLocations } from "services/SatimotoService"
import { StoreInterface, Store } from "stores/Store"
import { EvseStatus, EvseStatusSortMap } from "types/evse"
import { DEBUG } from "utils/build"
import { LOCATION_UPDATE_INTERVAL } from "utils/constants"
import { Log } from "utils/logging"
import { delta } from "utils/delta"
import { getEvse } from "services/SatimotoService"

const log = new Log("LocationStore")

export interface LocationStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    bounds: GeoJSON.Position[]
    locations: LocationModel[]

    selectedLocation: LocationModelLike
    selectedConnectors: ConnectorGroup[]

    searchConnector(identifier: string): Promise<ConnectorModelLike>
    selectLocation(uid: string): void
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

            actionSetBounds: action,
            actionUpdateLocations: action,
            actionSetSelectedLocation: action,
            actionRemoveSelectedLocation: action,
            actionUpdateActiveConnectors: action
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
                () => this.actionUpdateActiveConnectors()
            )

            reaction(
                () => this.stores.uiStore.filterExperimental && this.stores.uiStore.filterRemoteCapable && this.stores.uiStore.filterRfidCapable,
                () => this.resetFilterCapabilities()
            )
        } catch (error) {
            log.error(`Error Initializing: ${error}`)
        }
    }

    async fetchLocations() {
        if (this.stores.settingStore.accessToken) {
            if (this.bounds && this.bounds.length == 2) {
                const locations = await listLocations({
                    interval: this.lastLocationChanged ? 0 : LOCATION_UPDATE_INTERVAL,
                    isExperimental: this.stores.uiStore.filterExperimental,
                    isRemoteCapable: this.stores.uiStore.filterRemoteCapable,
                    isRfidCapable: this.stores.uiStore.filterRfidCapable,
                    xMin: this.bounds[1][0],
                    yMin: this.bounds[0][1],
                    xMax: this.bounds[0][0],
                    yMax: this.bounds[1][1]
                })

                this.actionUpdateLocations(locations.data.listLocations)
            }
        }
    }

    async refreshSelectedLocation() {
        if (this.selectedLocation) {
            return await this.selectLocation(this.selectedLocation.uid, this.selectedLocation.country)
        }

        throw Error("No location set")
    }

    async resetFilterCapabilities() {
        this.lastLocationChanged = true

        this.fetchLocations()
    }

    removeSelectedLocation(): void {
        this.actionRemoveSelectedLocation()
    }

    async selectLocation(uid: string, country?: string) {
        const locationResponse = await getLocation({ uid, country })
        const location = locationResponse.data.getLocation as LocationModel

        if (location) {
            this.actionSetSelectedLocation(location)
        }
    }

    async searchConnector(identifier: string): Promise<ConnectorModelLike> {
        const connectorResponse = await getConnector({ identifier })
        const connector = connectorResponse.data.getConnector as ConnectorModel

        if (connector.evse && connector.evse.location) {
            return connector
        }

        return undefined
    }

    async searchEvse(evseId: string): Promise<EvseModelLike> {
        const evseResponse = await getEvse({ evseId })
        const evse = evseResponse.data.getEvse as EvseModel

        if (evse.location && evse.connectors) {
            return evse
        }

        return undefined
    }

    async setBounds(bounds: GeoJSON.Position[]) {
        await this.actionSetBounds(bounds)
    }

    startLocationUpdates() {
        log.debug(`startLocationUpdates`)

        if (!this.locationUpdateTimer) {
            this.locationUpdateTimer = setInterval(this.fetchLocations.bind(this), LOCATION_UPDATE_INTERVAL * 1000)
            this.fetchLocations()
        }
    }

    stopLocationUpdates() {
        log.debug(`stopLocationUpdates`)
        clearInterval(this.locationUpdateTimer)
        this.locationUpdateTimer = null
    }

    /*
     * Mobx actions and reactions
     */

    actionRemoveSelectedLocation(): void {
        this.selectedLocation = undefined
    }

    async actionSetBounds(bounds: GeoJSON.Position[]) {
        if (
            this.bounds.length != bounds.length ||
            delta(this.bounds[0][0], bounds[0][0]) > 0.0005 ||
            delta(this.bounds[0][1], bounds[0][1]) > 0.0005 ||
            delta(this.bounds[1][0], bounds[1][0]) > 0.0005 ||
            delta(this.bounds[1][1], bounds[1][1]) > 0.0005
        ) {
            this.bounds.replace(bounds)
            this.lastLocationChanged = true

            this.fetchLocations()
        }
    }

    actionSetSelectedLocation(location: LocationModel) {
        this.selectedLocation = location
    }

    actionSetReady() {
        this.ready = true
    }

    actionUpdateActiveConnectors() {
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

    actionUpdateLocations(locations: LocationModel[]) {
        log.debug(`actionUpdateLocations ${this.locations.length} ${locations.length}`)

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
