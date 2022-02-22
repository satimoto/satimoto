import { ApolloClient, InMemoryCache } from "@apollo/client"
import { API_URI } from "utils/build"
import * as Authentication from "./satimoto/authentication"
import * as User from "./satimoto/user"

import { AuthenticationAction } from "./satimoto/authentication"

const client = new ApolloClient({
    uri: `${API_URI}/query`,
    cache: new InMemoryCache()
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
