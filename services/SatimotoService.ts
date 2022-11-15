import { ApolloClient, ApolloLink, HttpLink } from "@apollo/client"
import { setContext } from "@apollo/client/link/context"
import { onError } from "@apollo/client/link/error"
import { InvalidationPolicyCache } from "apollo-invalidation-policies"
import * as Authentication from "./satimoto/authentication"
import { AuthenticationAction } from "./satimoto/authentication"
import * as ChannelRequest from "./satimoto/channelRequest"
import type { CreateChannelRequestInput } from "./satimoto/channelRequest"
import * as Command from "./satimoto/command"
import * as Connector from "./satimoto/connector"
import * as Evse from "./satimoto/evse"
import * as InvoiceRequest from "./satimoto/invoiceRequest"
import type { UpdateInvoiceRequestInput } from "./satimoto/invoiceRequest"
import * as Location from "./satimoto/location"
import * as Rate from "./satimoto/rate"
import * as Session from "./satimoto/session"
import * as SessionInvoice from "./satimoto/sessionInvoice"
import * as Tariff from "./satimoto/tariff"
import * as Token from "./satimoto/token"
import * as TokenAuthorization from "./satimoto/tokenAuthorization"
import * as User from "./satimoto/user"
import store from "stores/Store"
import { API_URI } from "utils/build"
import { Log } from "utils/logging"
import { authenticate, getParams, LNURLAuthParams } from "services/LnUrlService"
import { doWhileBackoff } from "utils/tools"

const log = new Log("SatimotoService")

const uploadLink = new HttpLink({
    uri: `${API_URI}/v1/query`
})

const invalidationPolicyCache = new InvalidationPolicyCache({
    invalidationPolicies: {
        timeToLive: 59 * 1000
    }
})

const authLink = setContext((_, { headers }) => {
    const accessToken = store.settingStore.accessToken
    log.debug(`Access token: ${accessToken}`)

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
        graphQLErrors.map(({ message, locations, path }) => log.debug(message))
    }

    if (networkError) {
        log.debug(networkError.message)
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

// Rate
const getRate = Rate.getRate(client)

// Session
const getSession = Session.getSession(client)

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
const updateUser = User.updateUser(client)

// Token
const getAccessToken = async (pubkey: string, deviceToken?: string) => {
    return doWhileBackoff(
        "getAccessToken",
        async () => {
            try {
                const createAuthenticationResult = await createAuthentication(AuthenticationAction.REGISTER)
                const lnUrlParams = await getParams(createAuthenticationResult.data.createAuthentication.lnUrl)
                const lnUrlAuthParams = lnUrlParams as LNURLAuthParams

                log.debug("CreateAuthentication: " + JSON.stringify(createAuthenticationResult.data.createAuthentication))

                if (lnUrlAuthParams) {
                    const authenticateOk = await authenticate(lnUrlAuthParams)
                    
                    log.debug("Authentication: " + JSON.stringify(authenticateOk))

                    if (authenticateOk) {
                        try {
                            await createUser({
                                code: createAuthenticationResult.data.createAuthentication.code,
                                pubkey,
                                deviceToken
                            })
                        } catch (error) {
                            log.debug(`Error creating user: ${error}`)
                        }

                        const exchangeAuthenticationResult = await exchangeAuthentication(createAuthenticationResult.data.createAuthentication.code)

                        log.debug("ExchangeAuthentication: " + JSON.stringify(exchangeAuthenticationResult.data.exchangeAuthentication))

                        return exchangeAuthenticationResult.data.exchangeAuthentication.token
                    }
                }
            } catch (error) {
                log.error(`Error getting token: ${error}`)
            }
        },
        5000
    )
}

export type { CreateChannelRequestInput, UpdateInvoiceRequestInput }

export {
    // Access Token
    getAccessToken,
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
    // Rate
    getRate,
    // Session
    getSession,
    // SEssion Invoice
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
    updateUser
}

export default client
