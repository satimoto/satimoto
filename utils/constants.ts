import { Platform } from "react-native"
import { NETWORK } from "utils/build"

export const EMAIL_REGEX: RegExp = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

export const INTERVAL_RETRY = 1000
export const INTERVAL_MINUTE = 60000
export const IS_ANDROID = Platform.OS === "android"
export const IS_IOS = Platform.OS === "ios"

export const INVOICE_REQUEST_UPDATE_INTERVAL = 3600
export const SESSION_INVOICE_UPDATE_INTERVAL = 600
export const SESSION_UPDATE_INTERVAL = 10
export const LOCATION_UPDATE_INTERVAL = 60

export const LN_BECH32_PREFIX = NETWORK === "mainnet" ? "lnbc" : NETWORK === "testnet" ? "lntb" : "lnbcrt"
export const LNURL_CANONICAL_PHRASE =
    "DO NOT EVER SIGN THIS TEXT WITH YOUR PRIVATE KEYS! IT IS ONLY USED FOR DERIVATION OF LNURL-AUTH HASHING-KEY, DISCLOSING ITS SIGNATURE WILL COMPROMISE YOUR LNURL-AUTH IDENTITY AND MAY LEAD TO LOSS OF FUNDS!"

export const MINIMUM_REMOTE_CHARGE_BALANCE = 60000
export const MINIMUM_RFID_CHARGE_BALANCE = 60000

export const ONBOARDING_VERSION = "0.3.0"
export const APPLICATION_VERSION = "0.4.0"

export const INVOICE_EXPIRY = 3600
export const PAYMENT_TIMEOUT_SECONDS = 120
export const PAYMENT_FEE_LIMIT_SAT = 50000
export const PAYMENT_CLTV_LIMIT = 0

export const RECOVERY_WINDOW_DEFAULT = 250

export const SECURE_KEY_CIPHER_SEED_MNEMONIC = "CIPHER_SEED_MNEMONIC"
export const SECURE_KEY_WALLET_PASSWORD = "WALLET_PASSWORD"
export const SECURE_KEY_BREEZ_SDK_SEED_MNEMONIC = "BREEZ_SDK_SEED_MNEMONIC"
export const SECURE_KEY_GREENLIGHT_DEVICE_KEY_STORE = "GREENLIGHT_DEVICE_KEY_STORE"
export const SECURE_KEY_GREENLIGHT_DEVICE_CERT_STORE = "GREENLIGHT_DEVICE_CERT_STORE"


export const ASSET_IMAGES = [
    "amenity_advertising_column",
    "amenity_aerodrome",
    "amenity_arts_centre",
    "amenity_atm",
    "amenity_bank",
    "amenity_bar",
    "amenity_bbq",
    "amenity_bench",
    "amenity_bicycle_parking",
    "amenity_bicycle_repair_station",
    "amenity_biergarten",
    "amenity_boat_rental",
    "amenity_bureau_de_change",
    "amenity_bus_station",
    "amenity_cafe",
    "amenity_car_wash",
    "amenity_casino",
    "amenity_charging_station",
    "amenity_cinema",
    "amenity_community_centre",
    "amenity_courthouse",
    "amenity_dentist",
    "amenity_doctors",
    "amenity_drinking_water",
    "amenity_emergency_phone",
    "amenity_entrance",
    "amenity_excrement_bags",
    "amenity_fast_food",
    "amenity_ferry",
    "amenity_firestation",
    "amenity_fountain",
    "amenity_fuel",
    "amenity_helipad",
    "amenity_hospital",
    "amenity_hunting_stand",
    "amenity_ice_cream",
    "amenity_internet_cafe",
    "amenity_library",
    "amenity_motorcycle_parking",
    "amenity_nightclub",
    "amenity_parcel_locker",
    "amenity_parking",
    "amenity_parking_entrance_multistorey",
    "amenity_parking_entrance_underground",
    "amenity_parking_subtle",
    "amenity_parking_tickets",
    "amenity_pharmacy",
    "amenity_place_of_worship",
    "amenity_police",
    "amenity_post_box",
    "amenity_post_office",
    "amenity_prison",
    "amenity_pub",
    "amenity_public_bath",
    "amenity_public_bookcase",
    "amenity_public_transport_tickets",
    "amenity_recycling",
    "amenity_rental_bicycle",
    "amenity_rental_car",
    "amenity_restaurant",
    "amenity_shelter",
    "amenity_shower",
    "amenity_social_facility",
    "amenity_taxi",
    "amenity_telephone",
    "amenity_theatre",
    "amenity_toilets",
    "amenity_town_hall",
    "amenity_vehicle_inspection",
    "amenity_veterinary",
    "amenity_waste_basket",
    "amenity_waste_disposal",
    "barrier_cattle_grid",
    "barrier_cycle_barrier",
    "barrier_full_height_turnstile",
    "barrier_gate",
    "barrier_kissing_gate",
    "barrier_level_crossing",
    "barrier_level_crossing2",
    "barrier_lift_gate",
    "barrier_motorcycle_barrier",
    "barrier_stile",
    "barrier_toll_booth",
    "highway_bus_stop",
    "highway_elevator",
    "highway_ford",
    "highway_traffic_light",
    "historic_archaeological_site",
    "historic_bust",
    "historic_castle",
    "historic_city_gate",
    "historic_fort",
    "historic_fortress",
    "historic_manor",
    "historic_memorial",
    "historic_monument",
    "historic_obelisk",
    "historic_palace",
    "historic_plaque",
    "historic_shrine",
    "historic_statue",
    "historic_stone",
    "leisure_amusement_arcade",
    "leisure_beach_resort",
    "leisure_bird_hide",
    "leisure_bowling_alley",
    "leisure_firepit",
    "leisure_fishing",
    "leisure_fitness",
    "leisure_golf",
    "leisure_golf_pin",
    "leisure_miniature_golf",
    "leisure_outdoor_seating",
    "leisure_playground",
    "leisure_sauna",
    "leisure_slipway",
    "leisure_water_park",
    "man_made_bell_tower",
    "man_made_bunker",
    "man_made_chimney",
    "man_made_communications_tower",
    "man_made_crane",
    "man_made_cross",
    "man_made_generator_wind",
    "man_made_lighthouse",
    "man_made_mast",
    "man_made_mast_communications",
    "man_made_mast_lighting",
    "man_made_power_tower",
    "man_made_power_tower_small",
    "man_made_storage_tank",
    "man_made_telescope_dish",
    "man_made_telescope_dome",
    "man_made_tower_cantilever_communication",
    "man_made_tower_cooling",
    "man_made_tower_defensive",
    "man_made_tower_dish",
    "man_made_tower_dome",
    "man_made_tower_generic",
    "man_made_tower_lattice",
    "man_made_tower_lattice_communication",
    "man_made_tower_lattice_lighting",
    "man_made_tower_lighting",
    "man_made_tower_observation",
    "man_made_water_tower",
    "man_made_windmill",
    "natural_cave",
    "natural_peak",
    "natural_saddle",
    "natural_spring",
    "natural_waterfall",
    "office_consulate",
    "office_embassy",
    "place_place_4_z7",
    "place_place_4",
    "place_place_6_z7",
    "place_place_6",
    "place_place_capital_6",
    "place_place_capital_8",
    "religion_buddhist",
    "religion_christian",
    "religion_hinduist",
    "religion_jewish",
    "religion_muslim",
    "religion_shintoist",
    "religion_sikhist",
    "religion_taoist",
    "shop_alcohol",
    "shop_art",
    "shop_bag",
    "shop_bakery",
    "shop_beauty",
    "shop_bed",
    "shop_beverages",
    "shop_bicycle",
    "shop_bookmaker",
    "shop_butcher",
    "shop_car",
    "shop_car_parts",
    "shop_car_repair",
    "shop_carpet",
    "shop_charity",
    "shop_chemist",
    "shop_clothes",
    "shop_coffee",
    "shop_computer",
    "shop_confectionery",
    "shop_convenience",
    "shop_copyshop",
    "shop_dairy",
    "shop_deli",
    "shop_department_store",
    "shop_diy",
    "shop_electronics",
    "shop_fabric",
    "shop_florist",
    "shop_furniture",
    "shop_garden_centre",
    "shop_gift",
    "shop_greengrocer",
    "shop_hairdresser",
    "shop_hifi",
    "shop_houseware",
    "shop_interior_decoration",
    "shop_jewelry",
    "shop_laundry",
    "shop_marketplace",
    "shop_massage",
    "shop_medical_supply",
    "shop_mobile_phone",
    "shop_motorcycle",
    "shop_music",
    "shop_musical_instrument",
    "shop_newsagent",
    "shop_optician",
    "shop_outdoor",
    "shop_paint",
    "shop_perfumery",
    "shop_pet",
    "shop_photo",
    "shop_seafood",
    "shop_second_hand",
    "shop_shoes",
    "shop_sports",
    "shop_stationery",
    "shop_supermarket",
    "shop_tea",
    "shop_ticket",
    "shop_tobacco",
    "shop_toys",
    "shop_trade",
    "shop_travel_agency",
    "shop_tyres",
    "shop_variety_store",
    "shop_video",
    "shop_video_games",
    "tourism_alpinehut",
    "tourism_apartment",
    "tourism_artwork",
    "tourism_audioguide",
    "tourism_board",
    "tourism_camping",
    "tourism_caravan_park",
    "tourism_chalet",
    "tourism_guest_house",
    "tourism_guidepost",
    "tourism_hostel",
    "tourism_hotel",
    "tourism_map",
    "tourism_motel",
    "tourism_museum",
    "tourism_office",
    "tourism_picnic",
    "tourism_terminal",
    "tourism_viewpoint",
    "tourism_wilderness_hut"
]
