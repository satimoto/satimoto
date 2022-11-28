import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"
import { INVOICE_REQUEST_FRAGMENT } from "./fragment"

/**
 * List Invoice Requests
 */

 const LIST_INVOICE_REQUESTS = gql`
    ${INVOICE_REQUEST_FRAGMENT}
    query ListInvoiceRequests {
        listInvoiceRequests {
            ...InvoiceRequestFragment
        }
    }
`

const listInvoiceRequests = (client: ApolloClient<NormalizedCacheObject>) => {
    return async () => {
        return await client.query({
            query: LIST_INVOICE_REQUESTS,
            variables: {}
        })
    }
}

export { listInvoiceRequests }

/**
 * Update Invoice Request
 */

const UPDATE_INVOICE_REQUEST = gql`
    mutation updateInvoiceRequest($input: UpdateInvoiceRequestInput!) {
        updateInvoiceRequest(input: $input) {
            id
        }
    }
`

interface UpdateInvoiceRequestInput {
    id: number
    paymentRequest: string
}

const updateInvoiceRequest = (client: ApolloClient<NormalizedCacheObject>) => {
    return async (input: UpdateInvoiceRequestInput) => {
        return await client.mutate({
            mutation: UPDATE_INVOICE_REQUEST,
            variables: {
                input
            }
        })
    }
}

export type { UpdateInvoiceRequestInput }
export { updateInvoiceRequest }
