import { ApolloClient, ApolloLink, HttpLink } from "@apollo/client"
import { setContext } from "@apollo/client/link/context"
import { onError } from "@apollo/client/link/error"
import { InvalidationPolicyCache } from "apollo-invalidation-policies"
import * as Authentication from "./authentication"
import { AuthenticationAction } from "./authentication"
import * as ChannelRequest from "./channelRequest"
import type { CreateChannelRequestInput } from "./channelRequest"
import * as Command from "./command"
import * as Connector from "./connector"
import * as Evse from "./evse"
import * as InvoiceRequest from "./invoiceRequest"
import type { UpdateInvoiceRequestInput } from "./invoiceRequest"
import * as Location from "./location"
import * as Node from "./node"
import * as Poi from "./poi"
import * as Rate from "./rate"
import * as Session from "./session"
import * as SessionInvoice from "./sessionInvoice"
import * as Tariff from "./tariff"
import * as Token from "./token"
import * as TokenAuthorization from "./tokenAuthorization"
import * as User from "./user"
import store from "stores/Store"
import { API_URI, DEBUG } from "utils/build"
import { Log } from "utils/logging"

const log = new Log("SatimotoService")

const uploadLink = new HttpLink({
    uri: `${API_URI}/v1/query`
})

const invalidationPolicyCache = new InvalidationPolicyCache({
    invalidationPolicies: {
        timeToLive: 59 * 1000
    }
})

const authLink = setContext(({ query, variables, operationName }, { headers }) => {
    const accessToken = store.settingStore.accessToken

    if (DEBUG) {
        //log.debug(`SAT021: Query: ${JSON.stringify(query)}`)
        //log.debug(`SAT021: Operation: ${operationName}, Variables: ${JSON.stringify(variables)}`)
        log.debug(`SAT021: Access token: ${accessToken}`)
    }

    return {
        headers:
            (headers && headers.authorization) || !accessToken
                ? headers
                : {
                      ...headers,
                      authorization: `Bearer ${accessToken}`
                  }
    }
})

const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
        graphQLErrors.map(({ message }) => log.debug(`SAT022 onError: ${message}`, true))
    }

    if (networkError) {
        log.debug(`SAT023 onError: ${networkError.message}`, true)
    }
})

const client = new ApolloClient({
    cache: invalidationPolicyCache,
    link: ApolloLink.from([errorLink, authLink, uploadLink])
})

// Authentication
const createAuthentication = Authentication.createAuthentication(client)
const exchangeAuthentication = Authentication.exchangeAuthentication(client)
const verifyAuthentication = Authentication.verifyAuthentication(client)

// Channel Request
const createChannelRequest = ChannelRequest.createChannelRequest(client)

// Command
const startSession = Command.startSession(client)
const stopSession = Command.stopSession(client)

// Connector
const getConnector = Connector.getConnector(client)

// Evse
const getEvse = Evse.getEvse(client)

// Invoice Request
const listInvoiceRequests = InvoiceRequest.listInvoiceRequests(client)
const updateInvoiceRequest = InvoiceRequest.updateInvoiceRequest(client)

// Location
const getLocation = Location.getLocation(client)
const listLocations = Location.listLocations(client)

// Node
const listChannels = Node.listChannels(client)

// Poi
const getPoi = Poi.getPoi(client)
const listPois = Poi.listPois(client)

// Rate
const getRate = Rate.getRate(client)

// Session
const getSession = Session.getSession(client)
const listSessions = Session.listSessions(client)
const updateSession = Session.updateSession(client)

// Session Invoice
const getSessionInvoice = SessionInvoice.getSessionInvoice(client)
const listSessionInvoices = SessionInvoice.listSessionInvoices(client)
const updateSessionInvoice = SessionInvoice.updateSessionInvoice(client)

// Tariff
const getTariff = Tariff.getTariff(client)

// Token
const createToken = Token.createToken(client)
const listTokens = Token.listTokens(client)

// Token Authorization
const updateTokenAuthorization = TokenAuthorization.updateTokenAuthorization(client)

// User
const createUser = User.createUser(client)
const getUser = User.getUser(client)
const pongUser = User.pongUser(client)
const updateUser = User.updateUser(client)

export type { CreateChannelRequestInput, UpdateInvoiceRequestInput }

export {
    // Authentication
    AuthenticationAction,
    createAuthentication,
    exchangeAuthentication,
    verifyAuthentication,
    // Channel Request
    createChannelRequest,
    // Command
    startSession,
    stopSession,
    // Connector
    getConnector,
    // Evse
    getEvse,
    // Invoice Request
    listInvoiceRequests,
    updateInvoiceRequest,
    // Location
    getLocation,
    listLocations,
    // Node
    listChannels,
    // Poi
    getPoi,
    listPois,
    // Rate
    getRate,
    // Session
    getSession,
    listSessions,
    updateSession,
    // Session Invoice
    getSessionInvoice,
    listSessionInvoices,
    updateSessionInvoice,
    // Tariff
    getTariff,
    // Token
    createToken,
    listTokens,
    // Token Authorization
    updateTokenAuthorization,
    // User
    createUser,
    getUser,
    pongUser,
    updateUser
}

export default client
