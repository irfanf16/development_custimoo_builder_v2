/**
 * External HTTP Client for Ecommerce Platform APIs
 *
 * This client is used for making requests to external ecommerce platforms
 * (e.g., Shopify, WooCommerce) which use different domains and don't require
 * the same authentication as our internal API.
 */
import axios, { type AxiosInstance } from 'axios'

/**
 * Create an axios instance for external ecommerce platform requests
 */
export function createEcommerceHttpClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  })

  // Add response interceptor for error handling
  client.interceptors.response.use(
    response => response,
    error => {
      console.error('Ecommerce API Error:', error)
      const errorInstance = error instanceof Error ? error : new Error(String(error))
      return Promise.reject(errorInstance)
    }
  )

  return client
}
