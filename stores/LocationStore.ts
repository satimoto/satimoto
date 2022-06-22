import { action, extendObservable, makeObservable, observable, runInAction } from "mobx"
import { makePersistable } from "mobx-persist-store"
import LocationModel from "models/Location"
import moment from "moment"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { listLocations } from "services/SatimotoService"
import { StoreInterface, Store } from "stores/Store"
import { DEBUG } from "utils/build"
import { Log } from "utils/logging"

const log = new Log("LocationStore")

export interface LocationStoreInterface extends StoreInterface {
    hydrated: boolean
    stores: Store

    bounds: GeoJSON.Position[]
    locations: LocationModel[]

    setBounds(bounds: GeoJSON.Position[]): void
    monitorLocationUpdates(enable: boolean): void
}

export class LocationStore implements LocationStoreInterface {
    hydrated = false
    ready = false
    stores

    bounds
    locations
    locationUpdatesEnabled = false
    lastLocationUpdate?: string = undefined
    locationUpdateTimer: any = undefined

    constructor(stores: Store) {
        this.stores = stores
        this.bounds = observable<GeoJSON.Position>([])
        this.locations = observable<LocationModel>([])

        makeObservable(this, {
            hydrated: observable,
            ready: observable,

            bounds: observable,
            locations: observable,

            setBounds: action,
            updateLocations: action
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
        this.setReady()
    }

    setReady() {
        this.ready = true
    }

    async setBounds(bounds: GeoJSON.Position[]) {
        this.bounds.replace(bounds)
        this.lastLocationUpdate = undefined

        this.requestLocations()
    }

    monitorLocationUpdates(enable: boolean) {
        log.debug(`monitorLocationUpdates ${enable}`)

        if (enable && !this.locationUpdateTimer) {
            this.locationUpdateTimer = setInterval(this.requestLocations.bind(this), 60 * 1000)    
        } else {
            clearInterval(this.locationUpdateTimer)
        }
    }

    async requestLocations() {
        const locations = await listLocations({
            xMin: this.bounds[1][0],
            yMin: this.bounds[0][1],
            xMax: this.bounds[0][0],
            yMax: this.bounds[1][1],
            lastUpdate: this.lastLocationUpdate
        })

        this.updateLocations(locations.data.listLocations)
    }

    updateLocations(locations: LocationModel[]) {
        log.debug(`updateLocations ${this.locations.length} ${locations.length}`)
    
        if (this.lastLocationUpdate) {
            // Update/add to existing locations
            locations.forEach((location) => {
                let existingLocation = this.locations.find((l) => l.uid === location.uid)

                if (existingLocation) {
                    extendObservable(existingLocation, location)
                } else {
                    this.locations.push(location)
                }
            })
        } else {
            this.locations.replace(locations)
        }

        this.lastLocationUpdate = moment().format("YYYY-MM-DDTHH:mm:ssZ")
    }
}
