import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client"
import { setContext } from "@apollo/client/link/context"
import { onError } from "@apollo/client/link/error"
import * as Authentication from "./satimoto/authentication"
import { AuthenticationAction } from "./satimoto/authentication"
import * as User from "./satimoto/user"
import { store } from "stores/Store"
import { API_URI } from "utils/build"
import { Log } from "utils/logging"

const log = new Log("SatimotoService")

const uploadLink = new HttpLink({
    uri: `${API_URI}/query`
})

const authLink = setContext((_, { headers }) => {
    const accessToken = store.settingStore.accessToken

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

const createAuthentication = Authentication.createAuthentication(client)
const exchangeAuthentication = Authentication.exchangeAuthentication(client)
const verifyAuthentication = Authentication.verifyAuthentication(client)

const createUser = User.createUser(client)

export {
    AuthenticationAction,
    // Authentication
    createAuthentication,
    exchangeAuthentication,
    verifyAuthentication,
    // User
    createUser
}

export default client
