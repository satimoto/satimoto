import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"
import { SESSION_INVOICE_FRAGMENT } from "./fragment"

/**
 * Get Session Invoice
 */

const GET_SESSION_INVOICE = gql`
    ${SESSION_INVOICE_FRAGMENT}
    query GetSessionInvoice($id: ID!) {
        getSessionInvoice(id: $id) {
            ...SessionInvoiceFragment
        }
    }
`

const getSessionInvoice = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (id: number) => {
        return await client.query({
            query: GET_SESSION_INVOICE,
            variables: {
                id
            }
        })
    }
}

export { getSessionInvoice }

/**
 * List Session Invoices
 */

const LIST_SESSION_INVOICES = gql`
    ${SESSION_INVOICE_FRAGMENT}
    query ListSessionInvoices($input: ListSessionInvoicesInput!) {
        listSessionInvoices(input: $input) {
            ...SessionInvoiceFragment
        }
    }
`

interface ListSessionInvoicesInput {
    isSettled?: boolean
    isExpired?: boolean
}

const listSessionInvoices = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: ListSessionInvoicesInput) => {
        return await client.query({
            query: LIST_SESSION_INVOICES,
            variables: {
                input
            }
        })
    }
}

export { listSessionInvoices }

/**
 * Update Session Invoice
 */

 const UPDATE_SESSION_INVOICE = gql`
    ${SESSION_INVOICE_FRAGMENT}
    mutation UpdateSessionInvoice($id: ID!) {
        updateSessionInvoice(id: $id) {
            ...SessionInvoiceFragment
        }
    }
`

const updateSessionInvoice = (client: ApolloClient<NormalizedCacheObject>) => {
 return async (id: number) => {
     return await client.mutate({
         mutation: UPDATE_SESSION_INVOICE,
         variables: {
             id
         }
     })
 }
}

export { updateSessionInvoice }
