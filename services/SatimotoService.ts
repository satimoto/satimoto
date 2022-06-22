import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client"
import { setContext } from "@apollo/client/link/context"
import { onError } from "@apollo/client/link/error"
import * as Authentication from "./satimoto/authentication"
import { AuthenticationAction } from "./satimoto/authentication"
import * as ChannelRequest from "./satimoto/channelRequest"
import * as Command from "./satimoto/command"
import * as Location from "./satimoto/location"
import * as Rate from "./satimoto/rate"
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
    cache: new InMemoryCache(),
    link: ApolloLink.from([errorLink, authLink, uploadLink])
})

// Authentication
const createAuthentication = Authentication.createAuthentication(client)
const exchangeAuthentication = Authentication.exchangeAuthentication(client)
const verifyAuthentication = Authentication.verifyAuthentication(client)

// Location
const getLocation = Location.getLocation(client)
const listLocations = Location.listLocations(client)

// Rate
const getRate = Rate.getRate(client)

// Channel Request
const createChannelRequest = ChannelRequest.createChannelRequest(client)

// Command
const startSesion = Command.startSession(client)
const stopSesion = Command.stopSession(client)

// User
const createUser = User.createUser(client)
const updateUser = User.updateUser(client)

// Token
const getToken = async (pubkey: string, deviceToken: string) => {
    return doWhileBackoff(
        "getToken",
        async () => {
            try {
                const createAuthenticationResult = await createAuthentication(AuthenticationAction.REGISTER)
                const lnUrlParams = await getParams(createAuthenticationResult.data.createAuthentication.lnUrl)
                const lnUrlAuthParams = lnUrlParams as LNURLAuthParams

                if (lnUrlAuthParams) {
                    const authenticateOk = await authenticate(lnUrlAuthParams)

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

export {
    AuthenticationAction,
    // Authentication
    createAuthentication,
    exchangeAuthentication,
    verifyAuthentication,
    // Channel Request
    createChannelRequest,
    // Command
    startSesion,
    stopSesion,
    // Location
    getLocation,
    listLocations,
    // Rate
    getRate,
    // Token
    getToken,
    // User
    createUser,
    updateUser
}

export default client
